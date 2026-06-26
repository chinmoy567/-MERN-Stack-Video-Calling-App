const jwt = require("jsonwebtoken");

function getBearer(req) {
  const header = req.headers["authorization"];
  if (typeof header === "string" && header.startsWith("Bearer ")) {
    const t = header.slice(7).trim();
    if (t) return t;
  }
  return null;
}

const verifyRefreshToken = (req, res, next) => {
  const token = getBearer(req);
  if (!token) {
    return res.status(403).json({
      success: false,
      msg: "A refresh token is required",
    });
  }
  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    if (decoded.typ !== "refresh") {
      throw new Error("invalid type");
    }
    req.user = { userId: decoded.sub };
    return next();
  } catch {
    return res.status(401).json({
      success: false,
      msg: "Invalid or expired refresh token",
    });
  }
};

module.exports = verifyRefreshToken;
