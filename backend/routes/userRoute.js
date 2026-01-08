// Core modules
const express = require('express');
const path = require('path');
const multer = require('multer');
const userRoute = express.Router();
userRoute.use(express.json());


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
} = require("../helpers/validation");

const auth = require("../middleware/auth");



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
        const name = Date.now() + '-' + file.originalname;
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
  upload.single("image"), 
  registerValidator, 
  userController.userRegister
);

userRoute.post("/send-mail-verification", sendMailVerificationValidator,userController.sendMailVerification);
userRoute.post("/forgot-password",passwordResetValidator,userController.forgotPassword);
userRoute.post("/login", loginValidator, userController.loginUser);

//authenticated route
userRoute.get("/profile", auth, userController.userProfile);
userRoute.post("/update-profile", auth,upload.single("image"), updateProfileValidator, userController.updateProfile);
userRoute.get("/refresh-token", auth, userController.refreshToken);
userRoute.get("/logout", auth, userController.logout);

//otp verification routes
userRoute.post("/send-otp", otpMailValidator, userController.sendOtp);
userRoute.post("/verify-otp", verifyOtpValidator, userController.verifyOtp);


module.exports = userRoute;
  