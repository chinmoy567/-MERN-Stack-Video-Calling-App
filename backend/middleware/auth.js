//core modules
const jwt = require("jsonwebtoken");

//external modules
const Blacklist = require("../models/blacklistModel");

function getTokenFromRequest(req) {
  const header = req.headers["authorization"];
  if (typeof header === "string" && header.startsWith("Bearer ")) {
    const t = header.slice(7).trim();
    if (t) return t;
  }
  if (req.body && typeof req.body.token === "string" && req.body.token) {
    return req.body.token;
  }
  if (req.query && typeof req.query.token === "string" && req.query.token) {
    return req.query.token;
  }
  return null;
}

// Token Verification Middleware (access tokens only)
const verifyToken = async (req, res, next) => {
  const bearerToken = getTokenFromRequest(req);

  if (!bearerToken) {
    return res.status(403).json({
      success: false,
      msg: "A token is required for authentication",
    });
  }
  try {
    const blacklistedToken = await Blacklist.findOne({ token: bearerToken });

    if (blacklistedToken) {
      return res.status(400).json({
        success: false,
        msg: "This session has expired, please try again!",
      });
    }
    const decodedData = jwt.verify(bearerToken, process.env.ACCESS_TOKEN_SECRET);
    if (decodedData.typ !== "access") {
      return res.status(401).json({
        success: false,
        msg: "Invalid token",
      });
    }
    req.user = { userId: decodedData.sub };
  } catch (error) {
    return res.status(401).json({
      success: false,
      msg: "Invalid token",
    });
  }

  return next();
};

module.exports = verifyToken;
