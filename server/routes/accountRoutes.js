const express = require("express");
const router = express.Router();
const { body } = require("express-validator");

const authMiddleware = require("../middleware/authMiddleware");
const {
  deleteAccount,
  exportData,
} = require("../controllers/accountController");
router.delete(
  "/account",
  authMiddleware,
  [body("password", "Password is required for confirmation").not().isEmpty()],
  deleteAccount
);

router.get("/account/export", authMiddleware, exportData);

module.exports = router;
