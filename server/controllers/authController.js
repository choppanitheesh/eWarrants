// controllers/authController.js
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { generateEmailHTML } = require("../utils/emailTemplate");
const { NotFoundError, BadRequestError } = require("../utils/errorResponse");
const User = require("../models/User");

// Configure the email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// @desc    Register a new user
// @route   POST /api/register
exports.register = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { fullName, email, password } = req.body;
    const existingVerifiedUser = await User.findOne({
      email,
      isVerified: true,
    });
    if (existingVerifiedUser) {
      return res
        .status(400)
        .json({ msg: "An account with this email already exists." });
    }
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    await User.findOneAndUpdate(
      { email, isVerified: false },
      {
        fullName,
        password: hashedPassword,
        verificationCode,
        isVerified: false,
      },
      { upsert: true, new: true }
    );
    await transporter.sendMail({
      to: email,
      from: process.env.EMAIL_USER,
      subject: "[eWarrants] Your Verification Code",
      html: generateEmailHTML({
        title: "Verify Your Email",
        name: fullName,
        introText:
          "Thank you for registering! Please use the following code to verify your email address:",
        code: verificationCode,
        outroText: "This code will expire in 1 hour.",
      }),
    });
    res
      .status(200)
      .json({ msg: "A verification code has been sent to your email." });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify user email
// @route   POST /api/verify-email
exports.verifyEmail = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email, verificationCode: code });
    if (!user) {
      return res.status(400).json({ msg: "Invalid verification code." });
    }
    user.isVerified = true;
    user.verificationCode = undefined;
    await user.save();
    res
      .status(200)
      .json({ msg: "Account verified successfully. You can now log in." });
  } catch (err) {
    next(err);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid credentials." });
    if (!user.isVerified) {
      return res
        .status(400)
        .json({ msg: "Please verify your email before logging in." });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials." });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "8h",
    });
    res.json({ token });
  } catch (err) {
    next(err);
  }
};

// @desc    Forgot password
// @route   POST /api/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({
        msg: "If a user with that email exists, a reset code has been sent.",
      });
    }
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordCode = resetCode;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();
    await transporter.sendMail({
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: "[eWarrants] Your Password Reset Code",
      html: generateEmailHTML({
        title: "Password Reset Request",
        name: user.fullName,
        introText:
          "We received a request to reset your password. Please use the following code to complete the process:",
        code: resetCode,
        outroText:
          "This code will expire in 1 hour. If you did not request a password reset, please ignore this email.",
      }),
    });
    res.status(200).json({ msg: "A reset code has been sent." });
  } catch (err) {
    next(err);
  }
};

// @desc    Reset password
// @route   POST /api/reset-password
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, code, newPassword } = req.body;
    const user = await User.findOne({
      email,
      resetPasswordCode: code,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res
        .status(400)
        .json({ msg: "Invalid reset code or code has expired." });
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.status(200).json({ msg: "Password has been reset successfully." });
  } catch (err) {
    next(err);
  }
};

// @desc    Change user password
// @route   POST /api/change-password
exports.changePassword = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { currentPassword, newPassword } = req.body;

    // Find the user by the ID from their auth token
    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new NotFoundError("User not found."));
    }

    // Check if the provided current password is correct
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return next(new BadRequestError("Incorrect current password."));
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    res.status(200).json({ msg: "Password updated successfully." });
  } catch (err) {
    next(err);
  }
};
