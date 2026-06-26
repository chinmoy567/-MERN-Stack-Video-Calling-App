// core modules
const mongoose = require("mongoose");

const passwordResetSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    ref: "User",
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400, // auto-delete after 24 hours
  },
});

module.exports = mongoose.model("PasswordReset", passwordResetSchema);
