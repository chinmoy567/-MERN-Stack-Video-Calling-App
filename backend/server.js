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


app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));


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
    pingTimeout: 60000,
    cors: {
        origin: "http://localhost:5173",
        credentials: true
    }
});

io.on("connection", (socket) => {
    console.log("Socket io connected Successfully!", socket.id);
    SocketServer(socket, io);
});