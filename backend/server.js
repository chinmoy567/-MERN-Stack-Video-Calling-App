// coremodules
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

// External modules
const userRoute = require("./routes/userRoute");
const authRoute = require("./routes/authRoute");


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


// Start the server
app.listen(port, () => {
  console.log(` Server running on: http://localhost:${port}`);
});
