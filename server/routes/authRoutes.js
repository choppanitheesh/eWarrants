const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const rateLimit = require("express-rate-limit");
const authMiddleware = require("../middleware/authMiddleware");

const {
  register,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
} = require("../controllers/authController");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 20, 
  standardHeaders: true, 
  legacyHeaders: false, 
  message: {
    msg: "Too many requests from this IP, please try again after 15 minutes",
  },
});

router.post(
  "/register",
  authLimiter,
  [
    body("fullName", "Full name is required").not().isEmpty(),
    body("email", "Please include a valid email").isEmail(),
    body("password", "Password must be at least 6 characters").isLength({
      min: 6,
    }),
  ],
  register
);

router.post("/verify-email", verifyEmail);

router.post("/login", authLimiter, login); 

router.post("/forgot-password", authLimiter, forgotPassword); 

router.post("/reset-password", authLimiter, resetPassword); 
router.post(
  "/change-password",
  authMiddleware,
  [
    body("currentPassword", "Current password is required").not().isEmpty(),
    body("newPassword", "New password must be at least 6 characters").isLength({
      min: 6,
    }),
  ],
  changePassword
);

module.exports = router;
