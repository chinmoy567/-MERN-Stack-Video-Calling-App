// Core modules
const express = require('express');
const path = require('path');
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

const auth = require("../middleware/auth");
const refreshAuth = require("../middleware/refreshAuth");



// --- Multer Disk Storage Configuration ---
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
          cb(null, path.join(__dirname, "../public/images"));
        } else {
          cb(new Error(" Only JPEG and PNG files are allowed!"), false);
        }
    },
    filename: function(req, file, cb) {
        const safe = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, "_");
        const name = Date.now() + "-" + safe;
        cb(null, name);
    }
});
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type, only JPEG and PNG is allowed!"), false);
  }
};
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
});



// UserRoutes
userRoute.post(
  "/register",
  registerLimiter,
  upload.single("image"), 
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
userRoute.post("/update-profile", auth,upload.single("image"), updateProfileValidator, userController.updateProfile);
userRoute.get("/refresh-token", refreshAuth, userController.refreshToken);
userRoute.post("/logout", auth, userController.logout);

//otp verification routes
userRoute.post("/send-otp", otpLimiter, otpMailValidator, userController.sendOtp);
userRoute.post("/verify-otp", otpLimiter, verifyOtpValidator, userController.verifyOtp);
userRoute.get ('/all-users',auth, userController.getAllUsers);

module.exports = userRoute;


