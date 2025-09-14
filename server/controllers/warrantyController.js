const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fetch = require("node-fetch");
const { NotFoundError, BadRequestError } = require("../utils/errorResponse");
const { CATEGORIES } = require("../utils/constants");
const Warranty = require("../models/Warranty");
const User = require("../models/User");

// --- Configurations ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage() });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new BadRequestError("No file uploaded."));
    }
    const cloudinaryUpload = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: "auto" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });
    res.status(201).json({
      name: req.file.originalname,
      url: cloudinaryUpload.secure_url,
      fileType: req.file.mimetype,
    });
  } catch (err) {
    next(err);
  }
};

exports.processReceipt = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new BadRequestError("No image file uploaded."));
    }
    const cloudinaryUpload = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: "image" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      Analyze this receipt image. Your task is to extract specific details and generate a category.
      1. Extract the primary product name.
      2. Extract the purchase date in YYYY-MM-DD format.
      3. Extract and calculate the warranty period in MONTHS. Look for terms like "warranty", "guarantee".
         - If it's in years (e.g., "1 year warranty"), convert it to months (e.g., 12).
         - If no warranty is found, return null for this field.
      4. Generate a single, relevant category for the product from this list: [${CATEGORIES.join(
        ", "
      )}]. If no specific category from the list fits, use "Other".
      Return the data as a clean JSON object with the keys: "productName", "purchaseDate", "warrantyMonths", and "category". Do not include markdown formatting.
    `;
    const imagePart = {
      inlineData: {
        data: req.file.buffer.toString("base64"),
        mimeType: req.file.mimetype,
      },
    };
    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response
      .text()
      .replace(/```json|```/g, "")
      .trim();
    const jsonData = JSON.parse(text);
    const responseData = {
      ...jsonData,
      receipts: [
        {
          name: "Scanned Receipt",
          url: cloudinaryUpload.secure_url,
          fileType: req.file.mimetype,
        },
      ],
    };
    res.json(responseData);
  } catch (err) {
    err.message = `Failed to process receipt: ${err.message}`;
    next(err);
  }
};

exports.findProductImage = async (req, res, next) => {
  try {
    const { productName, category } = req.body;
    if (!productName) {
      return next(new BadRequestError("Product name is required."));
    }
    const query = encodeURIComponent(
      `${productName} ${category || ""} product shot official`
    );
    const apiKey = process.env.GOOGLE_API_KEY;
    const searchEngineId = process.env.SEARCH_ENGINE_ID;
    const url = `https://www.googleapis.com/customsearch/v1?q=${query}&key=${apiKey}&cx=${searchEngineId}&searchType=image&num=1`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.items && data.items.length > 0) {
      res.json({ imageUrl: data.items[0].link });
    } else {
      res.json({ imageUrl: null });
    }
  } catch (error) {
    next(error);
  }
};

exports.chat = async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) {
      return next(new BadRequestError("Message is required."));
    }
    const userId = req.user.id;
    const tools = [
      {
        functionDeclarations: [
          {
            name: "getWarranties",
            description:
              "Get a list of the user's warranties. Can be filtered and sorted.",
            parameters: {
              type: "OBJECT",
              properties: {
                category: {
                  type: "STRING",
                  description: `The category to filter by. Available categories are: ${CATEGORIES.join(
                    ", "
                  )}`,
                },
                expiringWithinDays: {
                  type: "NUMBER",
                  description:
                    "The number of days from today to check for expiring warranties.",
                },
                sortBy: {
                  type: "STRING",
                  description:
                    "The field to sort the warranties by. Use 'PURCHASE_DATE_ASC' for oldest first, or 'PURCHASE_DATE_DESC' for newest first.",
                  enum: ["PURCHASE_DATE_ASC", "PURCHASE_DATE_DESC"],
                },
              },
            },
          },
        ],
      },
    ];
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      tools,
      systemInstruction: `You are a helpful and friendly AI assistant for a warranty tracking app called eWarrants. Today's date is ${new Date().toDateString()}. When a user asks for their warranties, use the getWarranties tool. Do not guess or make up information. Be concise.`,
    });

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(message);
    const call = result.response.functionCalls()?.[0];

    if (call) {
      const { category, expiringWithinDays, sortBy } = call.args;
      let warranties;

      if (expiringWithinDays) {
        warranties = await Warranty.findExpiring(userId, expiringWithinDays);
      } else {
        const query = { user: userId };
        if (category) {
          query.category = new RegExp(category, "i");
        }
        let sortOrder = { purchaseDate: -1 };
        if (sortBy === "PURCHASE_DATE_ASC") {
          sortOrder = { purchaseDate: 1 };
        }

        warranties = await Warranty.find(query).sort(sortOrder).lean();
      }

      const result2 = await chat.sendMessage([
        {
          functionResponse: {
            name: "getWarranties",
            response: { warranties },
          },
        },
      ]);

      let responseData = warranties;
      if (sortBy && warranties.length > 0) {
        responseData = [warranties[0]];
      }

      res.json({ response: result2.response.text(), data: responseData });
    } else {
      res.json({ response: result.response.text(), data: [] });
    }
  } catch (err) {
    next(err);
  }
};

exports.createWarranty = async (req, res, next) => {
  try {
    const newWarranty = new Warranty({
      ...req.body,
      user: req.user.id,
    });
    const warranty = await newWarranty.save();
    res.status(201).json(warranty);
  } catch (err) {
    next(err);
  }
};

exports.getWarranties = async (req, res, next) => {
  try {
    const { lastPulledAt } = req.query;
    const query = { user: req.user.id };
    if (lastPulledAt) {
      query.updatedAt = { $gt: new Date(parseInt(lastPulledAt, 10)) };
    }
    const warranties = await Warranty.find(query).sort({ purchaseDate: -1 });
    res.json(warranties);
  } catch (err) {
    next(err);
  }
};

exports.getWarrantyById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const warranty = await Warranty.findOne({ _id: id, user: req.user.id });
    if (!warranty) {
      return next(new NotFoundError(`Warranty not found with id of ${id}`));
    }
    res.json(warranty);
  } catch (err) {
    next(err);
  }
};

exports.updateWarranty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedWarranty = await Warranty.findOneAndUpdate(
      { _id: id, user: req.user.id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!updatedWarranty) {
      return next(new NotFoundError(`Warranty not found with id of ${id}`));
    }
    res.json(updatedWarranty);
  } catch (err) {
    next(err);
  }
};

exports.deleteWarranty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const warranty = await Warranty.findOneAndDelete({
      _id: id,
      user: req.user.id,
    });
    if (!warranty) {
      return next(new NotFoundError(`Warranty not found with id of ${id}`));
    }
    res.json({ msg: "Warranty deleted successfully" });
  } catch (err) {
    next(err);
  }
};

exports.updateNotificationPrefs = async (req, res, next) => {
  try {
    const { enabled, reminderDays } = req.body;
    if (typeof enabled !== "boolean" || typeof reminderDays !== "number") {
      return next(new BadRequestError("Invalid input types."));
    }
    await User.findByIdAndUpdate(req.user.id, {
      $set: {
        "emailNotifications.enabled": enabled,
        "emailNotifications.reminderDays": reminderDays,
      },
    });
    res
      .status(200)
      .json({ msg: "Notification preferences updated successfully." });
  } catch (err) {
    next(err);
  }
};
