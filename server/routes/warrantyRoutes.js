const express = require("express");
const router = express.Router();
const multer = require("multer");
const authMiddleware = require("../middleware/authMiddleware");

const {
  uploadFile,
  processReceipt,
  findProductImage,
  chat,
  createWarranty,
  getWarranties,
  getWarrantyById,
  updateWarranty,
  deleteWarranty,
  updateNotificationPrefs,
} = require("../controllers/warrantyController");

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// --- Routes ---
router.post("/upload", authMiddleware, upload.single("file"), uploadFile);
router.post(
  "/process-receipt",
  authMiddleware,
  upload.single("receipt"),
  processReceipt
);
router.post("/find-product-image", authMiddleware, findProductImage);
router.post("/chat", authMiddleware, chat);

// Warranty CRUD Routes
router
  .route("/warranties")
  .post(authMiddleware, createWarranty)
  .get(authMiddleware, getWarranties);

router
  .route("/warranties/:id")
  .get(authMiddleware, getWarrantyById)
  .put(authMiddleware, updateWarranty)
  .delete(authMiddleware, deleteWarranty);

// Notification Preferences Route
router.post("/notification-prefs", authMiddleware, updateNotificationPrefs);

module.exports = router;
