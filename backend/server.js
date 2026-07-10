// coremodules
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const dns = require("dns");
const { Server } = require("socket.io");

// Some local/ISP DNS resolvers refuse SRV queries (mongodb+srv://) with
// querySrv ECONNREFUSED. Fall back to public resolvers so Atlas connects.
dns.setServers(["8.8.8.8", "1.1.1.1", ...dns.getServers()]);

// External modules
const userRoute = require("./routes/userRoute");
const { SocketServer } = require("./socketHandle");
const app = express();
const port = process.env.SERVER_PORT;

const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Static folder for images
app.use("/images", express.static(path.join(__dirname, "public/images")));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 400,
  standardHeaders: true,
  legacyHeaders: false,
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log(" Connected to MongoDB Atlas"))
  .catch((err) => console.error(" MongoDB connection error:", err));

// API — JSON only (no server-rendered views)
app.use("/api", apiLimiter, userRoute);
let server;

// Start the server
server = app.listen(port, () => {
  console.log(` Server running on: http://localhost:${port}`);
});

const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: corsOrigin,
    credentials: true,
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth && socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Authentication required"));
  }
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (decoded.typ !== "access") {
      return next(new Error("Invalid token"));
    }
    socket.userId = String(decoded.sub);
    return next();
  } catch {
    return next(new Error("Authentication required"));
  }
});

io.on("connection", (socket) => {
  console.log("Socket io connected Successfully!", socket.id);
  SocketServer(socket, io);
});

// Error handling middleware — must stay after all routes and socket setup
app.use((err, req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});
