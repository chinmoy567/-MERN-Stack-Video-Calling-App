

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
const mailer = require("../helpers/mailer");
const { oneMinuteExpiry,threeMinuteExpiry } = require("../helpers/otpValidate");


//necessary functions

// 1. Generate JWT access Token
const generateAccessToken = async (user) => {
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "48h",
  });
  return token;
};
// 2. Generate JWT refresh Token
const generateRefreshToken = async (user) => {
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "96h",
  });
  return token;
};
// 3. Generate Random 4 Digit OTP
const generateRandom4Digit = async () => {
    return Math.floor(1000 + Math.random() * 9000);
}




// User Registration Controller
const userRegister = async (req, res) => {

  try {
    const errors = validationResult(req);
    // res.setHeader("Content-Type", "application/json");
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
      msg: "User already exists"
    });
  }
  const hashPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      mobile,
      password: hashPassword,
      image: "images/" + req.file.filename,
    });

    const userData = await user.save();

    const msg = `
  <h1>Welcome to our Application</h1>
  <p>Please <a href="http://localhost:4000/mail-verification?id=${userData._id}">verify your email</a></p>
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
      msg: "problem  with user register" + error.message,
    });
  }
};

// mailVerification controller
const mailVerification = async (req, res) => {
    try {

      if (req.query.id == undefined) {
          return res.render('404');
        }

      const userData = await User.findOne({ _id: req.query.id }); 
      if(userData) {
      if (userData.is_verified == 1) {
      return res.render("mail-verification", {
        message: "Your mail already verified Successfully!",
      });
      }

     await User.findByIdAndUpdate(req.query.id,{$set: { is_verified: 1 },});
      return res.render("mail-verification", {
      message: "Mail has been verified Successfully",
      });
    }

    else{
      return res.render('mail-verification',{message:'usernot found'});
    }
  } 

  catch(error) {
    console.log("error when verifying maill" + error.message);
    return res.render('404');
  }
}

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

      if (!userData) {
        return res.status(400).json({
          success: false,
          msg: "Email doesn't exists!",
        });
      }
      if (userData.is_verified == 1) {
        return res.status(400).json({
          success: false,
          msg: userData.email + " mail is already verified!",
        });
      }


        const msg = `
        <h1>Welcome to our Application, '${userData.name}'</h1>
        <p>Please <a href="http://localhost:4000/mail-verification?id=${userData._id}">verify your email</a></p>
      `;
      mailer.sendMail(userData.email, "Mail Verification", msg);
          return res.status(200).json({
            success: true,
            msg: "verification link send to your  mail",

          });  
  } 

  catch (error) {
    return res.status(400).json({
      success: false,
      msg: error.message,
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

      if (!userData) {
        return res.status(400).json({
          success: false,
          msg: "Email doesn't exists!",
        });
      }

      const randomString = randomstring.generate();

      msg ="<p>Hii "+userData.name +',Please click <a href="http://localhost:4000/reset-password?token='+randomString+'">here</a> to reset your password.</p>';
      await PasswordReset.deleteMany({ user_id: userData._id });
      const passwordReset = new PasswordReset({
        user_id: userData._id,
        token: randomString,
      });

      await passwordReset.save();
      mailer.sendMail(userData.email, "Reset Password", msg)
      return res.status(201).json({
        success: true,
        msg: "Reset Password Link send to your mail, please check!",
      });
    }
    catch (error) {
      return res.status(400).json({
        success: false,
        msg: error.message,
      });
    }
};


//resetPassword controller
const resetPassword = async (req, res) => {
  try {
    if (req.query.token == undefined) {
      return res.render("404");
    }

    const resetData = await PasswordReset.findOne({ token: req.query.token });

    if (!resetData) {
      return res.render("404");
    }
    
    return res.render("reset-password", { resetData });
  }
   catch (error) {
    return res.render("404");
  }
};

// updatePassword controller
const updatePassword = async (req, res) => {
  try {
    const { user_id, password, c_password } = req.body;
    const resetData = await PasswordReset.findOne({ user_id });
    if (password != c_password) {
      return res.render("reset-password", {
        resetData,
        error:"Confirm Password does not match Password.",
      });
    }
    const hashedPassword = await bcrypt.hash(c_password, 10);
    await User.findByIdAndUpdate({ _id: user_id },
      {
        $set: {
          password: hashedPassword
        },
      }
    );
    await PasswordReset.deleteMany({ user_id });
    return res.redirect("/reset-success");
  } 

  catch (error) {
    return res.render("404");
  }
};

// resetSuccess controller
const resetSuccess = async (req, res) => {
  try {
    return res.render("reset-success");
  } catch (error) {
    return res.render("404");
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
      const userData = await User.findOne({ email });

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

      const refreshToken = await generateRefreshToken({ user: userData });
      const accessToken = await generateAccessToken({ user: userData });

      return res.status(200).json({
        success: true,
        msg: "Login Successfully!",
        user: userData,
        accessToken: accessToken,
        refreshToken: refreshToken,
        tokenType: "Bearer",
      });
    }

    catch (error) {
      return res.status(400).json({
        success: false,
        msg: error.message,
      });
    }
};

// userProfile controller 
const userProfile = async (req, res) => {
  try {
  const userData = req.user.user;
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
      const user_id = req.user.user._id;

      if (req.file != undefined) {
        data.image = "images/" + req.file.filename;
        const oldUser = await User.findOne({ _id: user_id });
        const oldFilePath = path.join(__dirname, "../public/" + oldUser.image);
        deleteFile(oldFilePath);
        }
      const userData = await User.findByIdAndUpdate(
        { _id:user_id },
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
    
    const userId = req.user.user_id;

    const userData = await User.findOne({ _id: userId });

    const accessToken = await generateAccessToken({ user: userData });
    const refreshToken = await generateRefreshToken({ user: userData });

    return res.status(200).json({
      success: true,
      msg: "Token Refreshed!",
      accessToken: accessToken,
      refreshToken: refreshToken,
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

    const bearer = token.split(" ");
    const bearerToken = bearer[1];

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

    if (!userData) {
      return res.status(400).json({
        success: false,
        msg: "Email doesn't exists!",
      });
    }

    if (userData.is_verified == 1) {
      return res.status(400).json({
        success: false,
        msg: userData.email + " mail is already verified!",
      });
    }

    const g_otp = await generateRandom4Digit();
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

    return res.status(200).json({
      success: true,
      msg: "Otp has been sent to your mail, please check!",
    });
  } 
  catch (error) {
    return res.status(400).json({
      success: false,
      msg: error.message,
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
      otp,
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



module.exports = {
  userRegister,
  mailVerification,
  sendMailVerification,
  forgotPassword,
  resetPassword,
  updatePassword,
  resetSuccess,
  loginUser,
  userProfile,
  updateProfile,
  refreshToken,
  logout,
  sendOtp,
  verifyOtp,
};
   