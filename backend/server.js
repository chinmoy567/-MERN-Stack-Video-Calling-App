// coremodules
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const {Server}= require('socket.io');

// External modules
const userRoute = require("./routes/userRoute");
const authRoute = require("./routes/authRoute");
const {SocketServer}= require('./socketHandle')
const app = express();
const port = process.env.SERVER_PORT;


const allowedOrigin = process.env.CLIENT_URL || "http://localhost:5173";

app.use(cors({
  origin: allowedOrigin,
  credentials: true
}));

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({ success: false, message: err.message || "Internal Server Error" });
});


//for views
app.set("view engine", "ejs");
app.set("views", "./views");



// Body parsing middleware 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// Static folder for images
app.use("/images", express.static(path.join(__dirname, "public/images")));



// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log(" Connected to MongoDB Atlas"))
  .catch((err) => console.error(" MongoDB connection error:", err));


// Middlewares
app.use("/api", userRoute);
app.use("/", authRoute);
let server;



// Start the server
server=app.listen(port, () => {
  console.log(` Server running on: http://localhost:${port}`);
});


const io = new Server(server, {
    pingTimeout: 30000,
    pingInterval: 10000,
    cors: {
        origin: allowedOrigin,
        credentials: true
    }
});

io.on("connection", (socket) => {
    console.log("Socket io connected Successfully!", socket.id);
    SocketServer(socket, io);
});