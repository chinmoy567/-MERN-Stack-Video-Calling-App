

// Core modules
const bcrypt = require("bcrypt");
const { validationResult } = require("express-validator");
const randomstring = require("randomstring");
const jwt = require("jsonwebtoken");
const path = require("path");


// External modules
const User = require("../models/userModel");
const PasswordReset = require("../models/passwordResetModel");
const Blacklist = require("../models/blacklistModel");
const Otp = require("../models/otpModel");
const { deleteFile } = require("../helpers/deletFile");
const {
  isConfigured: cloudinaryConfigured,
  uploadImageBuffer,
  deleteImage,
} = require("../config/cloudinary");
const mailer = require("../helpers/mailer");
const { oneMinuteExpiry,threeMinuteExpiry } = require("../helpers/otpValidate");


const frontendBaseUrl = () =>
  process.env.FRONTEND_URL || process.env.CORS_ORIGIN || "http://localhost:5173";

//necessary functions
const generateAccessToken = (userId) =>
  jwt.sign(
    { sub: String(userId), typ: "access" },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "1h" }
  );

const generateRefreshToken = (userId) =>
  jwt.sign(
    { sub: String(userId), typ: "refresh" },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

const generateEmailVerificationToken = (userId) =>
  jwt.sign(
    { sub: String(userId), typ: "verify" },
    process.env.EMAIL_TOKEN_SECRET,
    { expiresIn: "48h" }
  );

const genericEmailResponse = () => ({
  success: true,
  msg: "If an account exists for that email, we sent a message with next steps.",
});

// 6-digit OTP
const generateRandomOtp = () => Math.floor(100000 + Math.random() * 900000);

// Upload a profile image buffer to Cloudinary; returns { image, imagePublicId }.
const uploadProfileImage = async (file) => {
  if (!cloudinaryConfigured()) {
    throw new Error("Image upload service is not configured.");
  }
  const result = await uploadImageBuffer(file.buffer);
  return { image: result.secure_url, imagePublicId: result.public_id };
};

// Remove a user's previous image: Cloudinary asset or legacy local file.
const removeOldProfileImage = async (user) => {
  if (!user) return;
  if (user.imagePublicId) {
    await deleteImage(user.imagePublicId);
  } else if (
    user.image &&
    user.image.startsWith("images/") &&
    user.image !== "images/default-avatar.png"
  ) {
    deleteFile(path.join(__dirname, "../public/" + user.image));
  }
};



// User Registration Controller
const userRegister = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Errors",
        errors: errors.array(),
      });
    }

    const { name, email, mobile, password } = req.body;
    const isExists = await User.findOne({ email });

  if (isExists) {
    return res.status(400).json({
      success: false,
      msg: "Unable to register with this email address.",
    });
  }
  const hashPassword = await bcrypt.hash(password, 10);

    let imageData = { image: "images/default-avatar.png", imagePublicId: "" };
    if (req.file) {
      try {
        imageData = await uploadProfileImage(req.file);
      } catch (uploadError) {
        console.error("Profile image upload failed:", uploadError.message);
        return res.status(502).json({
          success: false,
          msg: "Profile image upload failed. Please try again.",
        });
      }
    }

    const user = new User({
      name,
      email,
      mobile,
      password: hashPassword,
      ...imageData,
    });

    const userData = await user.save();

    const verifyToken = generateEmailVerificationToken(userData._id);
    const msg = `
  <h1>Welcome to our Application</h1>
  <p>Please <a href="${frontendBaseUrl()}/verify-email?token=${verifyToken}">verify your email</a></p>
`;

mailer.sendMail(email, "Mail Verification", msg);

    return res.status(200).json({
      success: true,
      msg: "Registered Successfully!",
      user: userData,
    });
  }
   catch (error) {
    return res.status(400).json({
      success: false,
      msg: "Registration could not be completed.",
    });
  }
};

// GET /api/verify-email?token= — JSON only (UI is React)
const verifyEmail = async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) {
      return res.status(400).json({
        success: false,
        status: "missing_token",
        message: "Verification token is required.",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.EMAIL_TOKEN_SECRET);
    } catch {
      return res.status(400).json({
        success: false,
        status: "invalid_or_expired",
        message: "This verification link is invalid or has expired.",
      });
    }

    if (decoded.typ !== "verify") {
      return res.status(400).json({
        success: false,
        status: "invalid_token",
        message: "Invalid verification token.",
      });
    }

    const userData = await User.findById(decoded.sub);
    if (!userData) {
      return res.status(404).json({
        success: false,
        status: "user_not_found",
        message: "User not found.",
      });
    }

    if (userData.is_verified == 1) {
      return res.status(200).json({
        success: true,
        status: "already_verified",
        message: "Your email is already verified.",
      });
    }

    await User.findByIdAndUpdate(decoded.sub, { $set: { is_verified: 1 } });
    return res.status(200).json({
      success: true,
      status: "verified",
      message: "Mail has been verified successfully.",
    });
  } catch (error) {
    console.log("error when verifying mail" + error.message);
    return res.status(500).json({
      success: false,
      status: "server_error",
      message: "Verification could not be completed.",
    });
  }
};

// sendMailVerification controller
const sendMailVerification = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Errors",
        errors: errors.array(),
      });
    }
    const { email } = req.body;
    const userData = await User.findOne({ email });

      if (!userData || userData.is_verified == 1) {
        return res.status(200).json(genericEmailResponse());
      }

        const verifyToken = generateEmailVerificationToken(userData._id);
        const msg = `
        <h1>Welcome to our Application, '${userData.name}'</h1>
        <p>Please <a href="${frontendBaseUrl()}/verify-email?token=${verifyToken}">verify your email</a></p>
      `;
      mailer.sendMail(userData.email, "Mail Verification", msg);
          return res.status(200).json(genericEmailResponse());
  }

  catch (error) {
    return res.status(400).json({
      success: false,
      msg: "Request could not be processed.",
    });
  }
};

// forgotPassword controller
const forgotPassword = async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          msg: "Errors",
          errors: errors.array(),
        });
      }
      const { email } = req.body;
      const userData = await User.findOne({ email });

      if (userData) {

      const randomString = randomstring.generate();

      const msg ="<p>Hii "+userData.name +',Please click <a href="'+frontendBaseUrl()+'/reset-password?token='+randomString+'">here</a> to reset your password.</p>';
      await PasswordReset.deleteMany({ user_id: userData._id });
      const passwordReset = new PasswordReset({
        user_id: userData._id,
        token: randomString,
      });

      await passwordReset.save();
      mailer.sendMail(userData.email, "Reset Password", msg)
      }
      return res.status(201).json({
        success: true,
        msg: "If an account exists for that email, a reset link has been sent.",
      });
    }
    catch (error) {
      return res.status(400).json({
        success: false,
        msg: "Request could not be processed.",
      });
    }
};


// GET /api/reset-password/validate?token=
const validateResetToken = async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) {
      return res.status(400).json({
        success: false,
        status: "missing_token",
        message: "Reset token is required.",
      });
    }

    const resetData = await PasswordReset.findOne({ token });
    if (!resetData) {
      return res.status(400).json({
        success: false,
        status: "invalid_or_expired",
        message: "This reset link is invalid or has expired.",
      });
    }

    return res.status(200).json({
      success: true,
      status: "valid",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      status: "server_error",
      message: "Could not validate reset link.",
    });
  }
};

// POST /api/reset-password (JSON body)
const updatePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Errors",
        errors: errors.array(),
      });
    }

    const { password, c_password, token } = req.body;
    if (!token) {
      return res.status(400).json({
        success: false,
        status: "missing_token",
        message: "Invalid or expired reset link.",
      });
    }
    const resetData = await PasswordReset.findOne({ token });
    if (!resetData) {
      return res.status(400).json({
        success: false,
        status: "invalid_or_expired",
        message: "Invalid or expired reset link.",
      });
    }
    if (password != c_password) {
      return res.status(400).json({
        success: false,
        status: "password_mismatch",
        message: "Confirm password does not match password.",
      });
    }
    const user_id = resetData.user_id;
    const hashedPassword = await bcrypt.hash(c_password, 10);
    await User.findByIdAndUpdate(user_id, {
      $set: {
        password: hashedPassword,
      },
    });
    await PasswordReset.deleteMany({ user_id });
    return res.status(200).json({
      success: true,
      message: "Password reset successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Password reset could not be completed.",
    });
  }
};

// loginUser controller
const loginUser = async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          msg: "Errors",
          errors: errors.array(),
        });
      }

      const { email, password } = req.body;
      const userData = await User.findOne({ email }).select("+password");

      //check for  Email
      if (!userData) {
        return res.status(401).json({
          success: false,
          msg: "Email and Password is Incorrect!",
        });
      }
      //check for  Password
      const passwordMatch = await bcrypt.compare(password, userData.password);
      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          msg: "Email and Password is Incorrect!",
        });
      }
      //check for  user has verified their email or not
      if (userData.is_verified == 0) {
        return res.status(401).json({
          success: false,
          msg: "please verify your mail",
        });
      }

      const uid = userData._id;
      const refreshToken = generateRefreshToken(uid);
      const accessToken = generateAccessToken(uid);

      const userJson = userData.toObject();
      delete userJson.password;

      return res.status(200).json({
        success: true,
        msg: "Login Successfully!",
        user: userJson,
        accessToken: accessToken,
        refreshToken: refreshToken,
        tokenType: "Bearer",
      });
    }

    catch (error) {
      return res.status(400).json({
        success: false,
        msg: "Login could not be completed.",
      });
    }
};

// userProfile controller
const userProfile = async (req, res) => {
  try {
    const userData = await User.findById(req.user.userId);
    if (!userData) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }
    return res.status(200).json({
      success: true,
      msg: "User Profile Data!",
      data: userData,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: error.message,
    });
  }
};


// updateProfile controller
const updateProfile = async (req, res) => {
  try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          msg: "Errors",
          errors: errors.array(),
        });
      }
      const { name, mobile } = req.body;
      const data = {name,mobile};
      const user_id = req.user.userId;

      if (req.file != undefined) {
        let uploaded;
        try {
          uploaded = await uploadProfileImage(req.file);
        } catch (uploadError) {
          console.error("Profile image upload failed:", uploadError.message);
          return res.status(502).json({
            success: false,
            msg: "Profile image upload failed. Please try again.",
          });
        }
        // Only after the new image is safely stored, remove the old one.
        const oldUser = await User.findById(user_id);
        await removeOldProfileImage(oldUser);
        data.image = uploaded.image;
        data.imagePublicId = uploaded.imagePublicId;
      }
      const userData = await User.findByIdAndUpdate(
        user_id,
        { $set: data }, { new: true }
      );

      return res.status(200).json({
        success: true,
        msg: "User Updated Successfully!",
        user: userData,
      });
    }
     catch (error) {
      return res.status(400).json({
        success: false,
        msg: error.message,
      });
    }
};

// refreshToken controller
const refreshToken = async (req, res) => {

  try {

    const userId = req.user.userId;

    const userData = await User.findOne({ _id: userId });

    if (!userData) {
      return res.status(401).json({
        success: false,
        msg: "User not found",
      });
    }

    const accessToken = generateAccessToken(userId);
    const newRefreshToken = generateRefreshToken(userId);

    return res.status(200).json({
      success: true,
      msg: "Token Refreshed!",
      accessToken: accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: error.message,
    });
  }
};

// logout controller
const logout = async (req, res) => {
  try {
    const token =
      (req.body && req.body.token) ||
      req.query.token ||
      req.headers["authorization"];

    if (!token || typeof token !== "string") {
      return res.status(400).json({ success: false, msg: "Token required" });
    }
    const parts = token.trim().split(/\s+/);
    const bearerToken = parts.length === 2 && parts[0] === "Bearer" ? parts[1] : parts[0];

    const newBlacklist = new Blacklist({
      token: bearerToken,
    });

    await newBlacklist.save();

    res.setHeader("Clear-Site-Data", '"cookies","storage"');
    return res.status(200).json({
      success: true,
      msg: "You are logged out!",
    });
  }
  catch (error) {
    return res.status(400).json({
      success: false,
      msg: error.message,
    });
  }
};

// sendOtp controller
const sendOtp = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Errors",
        errors: errors.array(),
      });
    }

    const { email } = req.body;
    const userData = await User.findOne({ email });

    if (!userData || userData.is_verified == 1) {
      return res.status(200).json(genericEmailResponse());
    }

    const g_otp = await generateRandomOtp();
    const oldOtpData = await Otp.findOne({ user_id: userData._id });

    if (oldOtpData) {
      const sendNextOtp = await oneMinuteExpiry(oldOtpData.timestamp);
      if (!sendNextOtp) {
        return res.status(400).json({
          success: false,
          msg: "Pls try after some time!",
        });
      }
    }
    const cDate = new Date();
    await Otp.findOneAndUpdate(
      { user_id: userData._id },
      { otp: g_otp, timestamp: new Date(cDate.getTime()) },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const msg =
      "<p> Hii <b>" + userData.name + "</b>, </br> <h4>" + g_otp + "</h4></p>";

    mailer.sendMail(userData.email, "Otp Verification", msg);

    return res.status(200).json(genericEmailResponse());
  }
  catch (error) {
    return res.status(400).json({
      success: false,
      msg: "Request could not be processed.",
    });
  }
};


const verifyOtp = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Errors",
        errors: errors.array(),
      });
    }

    const { user_id, otp } = req.body;

    const otpData = await Otp.findOne({
      user_id,
      otp: Number(otp),
    });

    if (!otpData) {
      return res.status(400).json({
        success: false,
        msg: "You entered wrong OTP!",
      });
    }

    const isOtpExpired = await threeMinuteExpiry(otpData.timestamp);

    if (isOtpExpired) {
      return res.status(400).json({
        success: false,
        msg: "Your OTP has been Expired!",
      });
    }

    await User.findByIdAndUpdate(
      {
        _id: user_id,
      },
      {
        $set: {
          is_verified: 1,
        },
      }
    );

    return res.status(200).json({
      success: true,
      msg: "Account Verified Successfully!",
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: error.message,
    });
  }
};


const getAllUsers = async (req, res) => {
  try {

    const userId = req.user.userId;

    const users = await User.find({
      _id: { $ne: userId }
    }).select("-password");

    return res.status(200).json({
      success: true,
      msg: 'All users!',
      data: users
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: error.message
    });
  }
};

module.exports = {
  userRegister,
  verifyEmail,
  sendMailVerification,
  forgotPassword,
  validateResetToken,
  updatePassword,
  loginUser,
  userProfile,
  updateProfile,
  refreshToken,
  logout,
  sendOtp,
  verifyOtp,
  getAllUsers
};
