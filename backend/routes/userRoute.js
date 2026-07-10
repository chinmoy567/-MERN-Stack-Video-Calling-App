// Core modules
const express = require('express');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const userRoute = express.Router();
userRoute.use(express.json());

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 25 });
const registerLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 15 });
const forgotLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 8 });
const otpLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 15 });
const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});


// External modules
const userController = require("../controllers/userController");
const {
  registerValidator,
  sendMailVerificationValidator,
  passwordResetValidator,
  loginValidator,
  updateProfileValidator,
  otpMailValidator,
  verifyOtpValidator,
  resetPasswordSubmitValidator,
} = require("../helpers/validation");

const messageController = require("../controllers/messageController");

const auth = require("../middleware/auth");
const refreshAuth = require("../middleware/refreshAuth");



// --- Multer Memory Storage (images are uploaded to Cloudinary, not disk) ---
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

const fileFilter = (req, file, cb) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const err = new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname);
    err.message = "Invalid file type. Only JPG, JPEG, PNG and WEBP are allowed.";
    cb(err, false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: MAX_IMAGE_SIZE },
});

// Wrap multer so validation errors return clean 400 JSON instead of a 500.
const uploadImage = (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      const msg =
        err.code === "LIMIT_FILE_SIZE"
          ? "Image is too large. Maximum size is 5 MB."
          : err.message || "Image upload failed.";
      return res.status(400).json({ success: false, msg });
    }
    next();
  });
};



// UserRoutes
userRoute.post(
  "/register",
  registerLimiter,
  uploadImage,
  registerValidator,
  userController.userRegister
);

userRoute.post("/send-mail-verification", sendMailVerificationValidator,userController.sendMailVerification);
userRoute.post("/forgot-password", forgotLimiter, passwordResetValidator,userController.forgotPassword);
userRoute.post("/login", loginLimiter, loginValidator, userController.loginUser);

// Email / reset flows — JSON only (React UI)
userRoute.get("/verify-email", userController.verifyEmail);
userRoute.get("/reset-password/validate", userController.validateResetToken);
userRoute.post(
  "/reset-password",
  resetPasswordLimiter,
  resetPasswordSubmitValidator,
  userController.updatePassword
);

//authenticated route
userRoute.get("/profile", auth, userController.userProfile);
userRoute.post("/update-profile", auth, uploadImage, updateProfileValidator, userController.updateProfile);
userRoute.get("/refresh-token", refreshAuth, userController.refreshToken);
userRoute.post("/logout", auth, userController.logout);

//otp verification routes
userRoute.post("/send-otp", otpLimiter, otpMailValidator, userController.sendOtp);
userRoute.post("/verify-otp", otpLimiter, verifyOtpValidator, userController.verifyOtp);
userRoute.get ('/all-users',auth, userController.getAllUsers);

// messaging routes
userRoute.get("/conversations", auth, messageController.getConversations);
userRoute.get("/messages/:userId", auth, messageController.getMessages);

module.exports = userRoute;


