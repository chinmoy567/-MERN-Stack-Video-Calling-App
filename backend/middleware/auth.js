
//core modules
const jwt = require("jsonwebtoken");

//external modules
const Blacklist = require("../models/blacklistModel");

//config file
const config = process.env;


// Token Verification Middleware
const verifyToken = async (req, res, next) => {
    const token =
      (req.body && req.body.token) ||
      req.query.token ||
      req.headers["authorization"];

    if (!token) {
      return res.status(403).json({
        success: false,
        msg: "A token is required for authentication",
      });
    }
    try {
      const bearer = token.split(" ");
      const bearerToken = bearer[1];
      const blacklistedToken = await Blacklist.findOne({ token: bearerToken });

      if (blacklistedToken) {
        return res.status(400).json({
          success: false,
          msg: "This session has expired, please try again!",
        });
      }

      const decodedData = jwt.verify(bearerToken, config.ACCESS_TOKEN_SECRET);
      req.user = decodedData;
    } 
    catch (error) {
      return res.status(401).json({
        success: false,
        msg: "Invalid token",
      });
    }

    return next();
};

module.exports = verifyToken;
