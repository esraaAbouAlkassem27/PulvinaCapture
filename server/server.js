const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const multer = require("multer");
const cors = require("cors");
const routes = require("./routes");
const Screenshot = require("./models/Screenshot");
const { Schema } = mongoose;

const app = express();
const port = 4001;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

// Multer configuration for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/screenshots", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define a schema and model for the screenshots
// const screenshotSchema = new Schema({
//   projectName: String,
//   screenshot: Buffer,
//   timestamp: Date,
//   mouseMovements: Array,
//   keyPresses: Array,
// });

// const Screenshot = mongoose.model("Screenshot", screenshotSchema);

// Route to handle screenshot upload
app.post(
  "/upload-screenshot",
  upload.single("screenshot"),
  async (req, res) => {
    try {
      const { projectName, mouseMovements, keyPresses, timestamp } = req.body;
      console.log("🚀 ~  req.body:", req.body);
      const screenshot = req.file.buffer;
      

      const newScreenshot = new Screenshot({
        projectName,
        screenshot,
        timestamp,
        mouseMovements,
        keyPresses,
      });

      await newScreenshot.save();
      console.log("🚀 ~  req.body:SAVEDDDDDDDDDDD");
      res.status(200).send("Screenshot saved successfully!");
    } catch (error) {
      console.error("Error saving screenshot:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);
app.use("/api", routes);
// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
