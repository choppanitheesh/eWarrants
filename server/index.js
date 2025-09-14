const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");
const cron = require("node-cron");
require("dotenv").config();

const errorHandlerMiddleware = require("./errorHandler");
const authRoutes = require("./routes/authRoutes");
const warrantyRoutes = require("./routes/warrantyRoutes");
const accountRoutes = require("./routes/accountRoutes");
const User = require("./models/User");
const Warranty = require("./models/Warranty");

// --- App Configurations ---
const app = express();
app.use(cors());
app.use(express.json());

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// --- Connect to MongoDB ---
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected..."))
  .catch((err) => console.error(err));

// --- API ROUTES ---
app.use("/api", authRoutes);
app.use("/api", warrantyRoutes);
app.use("/api", accountRoutes);


// --- Daily Notification Scheduler ---
const sendExpirationEmails = async () => {
  console.log("Running daily email check for expiring warranties...");
  try {
    const usersToNotify = await User.find({
      "emailNotifications.enabled": true,
    });

    for (const user of usersToNotify) {
      const reminderDays = user.emailNotifications.reminderDays;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const targetExpiryDate = new Date(today);
      targetExpiryDate.setDate(today.getDate() + reminderDays);

      const expiringWarranties = await Warranty.find({
        user: user._id,
        $expr: {
          $eq: [
            {
              $dateToString: {
                format: "%Y-%m-%d",
                date: {
                  $dateAdd: {
                    startDate: "$purchaseDate",
                    unit: "month",
                    amount: "$warrantyLengthMonths",
                  },
                },
              },
            },
            { $dateToString: { format: "%Y-%m-%d", date: targetExpiryDate } },
          ],
        },
      });

      if (expiringWarranties.length > 0) {
        const productNames = expiringWarranties
          .map((w) => w.productName)
          .join(", ");
        console.log(
          `Sending expiry email to ${user.email} for: ${productNames}`
        );
        await transporter.sendMail({
          to: user.email,
          from: process.env.EMAIL_USER,
          subject: `[eWarrants] You have warranties expiring in ${reminderDays} days!`,
          html: `<p>Hi ${
            user.fullName
          },</p><p>This is a reminder that the following warranties are expiring in <strong>${reminderDays} days</strong>:</p><ul>${expiringWarranties
            .map((w) => `<li><strong>${w.productName}</strong></li>`)
            .join(
              ""
            )}</ul><p>Log in to your eWarrants app to see the details.</p>`,
        });
      }
    }
  } catch (error) {
    console.error("Error sending expiration emails:", error);
  }
};

cron.schedule("0 8 * * *", sendExpirationEmails, {
  timezone: "Asia/Kolkata",
});

app.use(errorHandlerMiddleware);

// --- Start Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
