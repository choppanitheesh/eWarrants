const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  verificationCode: { type: String },
  resetPasswordCode: { type: String },
  resetPasswordExpires: { type: Date },
  emailNotifications: {
    enabled: { type: Boolean, default: false },
    reminderDays: { type: Number, default: 30 },
  },
});

const User = mongoose.model("User", UserSchema);

module.exports = User;
