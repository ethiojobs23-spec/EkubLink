// Payment Routes
const express = require("express");
const multer = require("multer");
const path = require("path");
const { submitPayment, getPendingPayments, reviewPayment, getMyPayments } = require("../controllers/payment.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

// ─── Multer File Upload Configuration ────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `receipt-${req.user.id}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, and WebP images are allowed for receipts."), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 5) * 1024 * 1024,
  },
});

// Error handler for multer
const handleUpload = (req, res, next) => {
  const uploader = upload.single("receipt");
  uploader(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: `File too large. Max size is ${process.env.MAX_FILE_SIZE_MB || 5}MB.` });
      }
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    }
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

// GIVER routes
router.post("/submit", authenticate, authorize("GIVER"), handleUpload, submitPayment);
router.get("/my-payments/:groupId", authenticate, authorize("GIVER"), getMyPayments);

// COLLECTOR routes
router.get("/pending/:groupId", authenticate, authorize("COLLECTOR"), getPendingPayments);
router.patch("/:paymentId/review", authenticate, authorize("COLLECTOR"), reviewPayment);

module.exports = router;
