const { check } = require("express-validator");

//registerValidator
exports.registerValidator = [
  // 1. Name Validation
  check("name", "Name is required").not().isEmpty(),

  // 2. Email Validation
  check("email", "Please include a valid email").isEmail().normalizeEmail({
    gmail_remove_dots: true,
  }),

  // 3. Mobile Validation
  check("mobile", "Mobile No. should be contains 10 digits").isLength({
    min: 10,
    max: 10,
  }),

  // 4. Password Validation
  check(
    "password",
    "Password must be greater than 6 characters, and contains at least one upper..."
  ).isStrongPassword({
    minLength: 6,
    minUppercase: 1,
    minLowercase: 1,
    minNumbers: 1,
  }),
  check("image")
    .custom((value, { req }) => {
      if (
        req.file.mimetype === "image/jpeg" ||
        req.file.mimetype === "image/png"
      ) {
        return true;
      } else {
        return false;
      }
    })
    .withMessage("Please upload an image Jpeg, PNG"),
];

//sendMailVerificationValidator
exports.sendMailVerificationValidator = [
  check("email", "Please include a valid email")
    .isEmail()
    .normalizeEmail({ gmail_remove_dots: true }),
];

//passwordResetValidator
exports.passwordResetValidator = [
  check("email", "Please include a valid email")
    .isEmail()
    .normalizeEmail({ gmail_remove_dots: true }),
];

//loginValidator
exports.loginValidator = [
  check("email", "Please include a valid email").isEmail().normalizeEmail({
    gmail_remove_dots: true,
  }),
  check("password", "Password is required").not().isEmpty(),
];

//updateProfileValidator
exports.updateProfileValidator = [
  check("name", "Name is required").not().isEmpty(),
  check("mobile", "Mobile No. should be contains 10 digits.").isLength({
    min: 10,
    max: 10,
  }),
];
//otpMailValidator
exports.otpMailValidator = [
  check("email", "Please include a valid email").isEmail().normalizeEmail({
    gmail_remove_dots: true,
  }),
];
//verifyOtpValidator
exports.verifyOtpValidator = [
  check("user_id", "User Id is required").not().isEmpty(),
  check("otp", "OTP is required").not().isEmpty(),
];