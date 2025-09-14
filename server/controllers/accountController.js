const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const { Parser } = require("json2csv");
const User = require("../models/User");
const Warranty = require("../models/Warranty");
const { NotFoundError, BadRequestError } = require("../utils/errorResponse");

// @desc    Delete user account and all their data
// @route   DELETE /api/account
exports.deleteAccount = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { password } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return next(new NotFoundError("User not found."));
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(new BadRequestError("Incorrect password."));
    }

    await Warranty.deleteMany({ user: userId });
    await User.findByIdAndDelete(userId);

    res.status(200).json({});
  } catch (err) {
    next(err);
  }
};

// @desc    Export user's warranty data as a CSV file
// @route   GET /api/account/export
exports.exportData = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const warranties = await Warranty.find({ user: userId }).lean();

    if (!warranties || warranties.length === 0) {
      return next(new NotFoundError("No warranties found to export."));
    }

    const fields = [
      { label: "Product Name", value: "productName" },
      { label: "Category", value: "category" },
      { label: "Purchase Date", value: "purchaseDate" },
      { label: "Warranty Length (Months)", value: "warrantyLengthMonths" },
      { label: "Expiry Date", value: "expiryDate" },
      { label: "Description", value: "description" },
      { label: "Receipt URLs", value: "receiptUrls" },
    ];

    const formattedWarranties = warranties.map((w) => {
      const purchaseDate = new Date(w.purchaseDate);
      const expiryDate = new Date(purchaseDate);
      expiryDate.setMonth(purchaseDate.getMonth() + w.warrantyLengthMonths);

      return {
        productName: w.productName,
        category: w.category || "N/A",
        purchaseDate: purchaseDate.toLocaleDateString(),
        warrantyLengthMonths: w.warrantyLengthMonths,
        expiryDate: expiryDate.toLocaleDateString(),
        description: w.description || "",
        receiptUrls: w.receipts.map((r) => r.url).join(", "),
      };
    });

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(formattedWarranties);

    res.header("Content-Type", "text/csv");
    res.attachment("eWarrants_Export.csv");
    res.send(csv);
  } catch (err) {
    next(err);
  }
};
