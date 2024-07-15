const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const multer = require("multer");
const cors = require("cors");
const TimeTrackingInfo = require("./models/TimeTrackingInfo");
const Screenshot = require("./models/Screenshot");
const { Schema } = mongoose;

const app = express();
const port = 4000;

// Middleware
app.use(cors()); // Allow cross-origin requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Multer configuration for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/screenshots", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("Error connecting to MongoDB:", error));

// Define a schema and model for the screenshots
// const screenshotSchema = new Schema({
//   projectName: String,
//   screenshot: Buffer,
//   timestamp: Date,
//   mouseMovements: Array,
//   keyPresses: Array,
// });

// const Screenshot = mongoose.model("Screenshot", screenshotSchema);

// Simple GET endpoint for testing
app.get("/test", (req, res) => {
  res.send("Server is up and running!");
});

// Route to handle screenshot upload
app.post(
  "/upload-screenshot",
  upload.single("screenshot"),
  async (req, res) => {
    try {
      console.log("Received request:", req.body);
      const { projectName, timestamp } = req.body;

      const mouseMovements = JSON.parse(req.body.mouseMovements || "[]");
      const keyPresses = JSON.parse(req.body.keyPresses || "[]");

      const screenshot = req.file.buffer;

      const newScreenshot = new Screenshot({
        projectName,
        screenshot,
        timestamp,
        mouseMovements,
        keyPresses,
      });

      const savedScreenshot = await newScreenshot.save();

      res.status(200).json({
        message: "Screenshot saved successfully!",
        lastScreenshotID: savedScreenshot._id,
      });
    } catch (error) {
      console.error("Error saving screenshot:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);
app.delete("/delete-screenshot/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedScreenshot = await Screenshot.findByIdAndDelete(id);

    if (!deletedScreenshot) {
      return res.status(404).json({ message: "Screenshot not found" });
    }
    const lastScreenshot = await Screenshot.findOne().sort({ timestamp: -1 });
    res.status(200).json({
      message: "Screenshot deleted successfully!",
      lastScreenshot: lastScreenshot,
    });
  } catch (error) {
    console.error("Error deleting screenshot:", error);
    res.status(500).send("Internal Server Error");
  }
});

function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}
app.post("/update-tracked-time", async (req, res) => {
  try {
    const { trackedTime } = req.body; // trackedTime in milliseconds
    const trackedHours = trackedTime / 3600000; // Convert milliseconds to hours

    if (isNaN(trackedHours)) {
      throw new Error("Invalid tracked time provided");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day
    const startOfWeek = getStartOfWeek(today);

    // Find or create today's document
    let todayTracking = await TimeTrackingInfo.findOne({ date: today });
    if (!todayTracking) {
      todayTracking = new TimeTrackingInfo({
        date: today,
        hoursTracked: 0,
        weekStartDate: startOfWeek,
        weekTotalHours: 0,
      });
    }
    // Update today's hours
    todayTracking.hoursTracked += trackedHours;

    // Find the current week's documents
    const weekDocuments = await TimeTrackingInfo.find({
      date: { $gte: startOfWeek, $lte: today },
    });

    // Calculate the new week total
    const newWeekTotal =
      weekDocuments.reduce((total, doc) => total + doc.hoursTracked, 0) +
      trackedHours;

    // Update all documents in the current week with the new week total
    await TimeTrackingInfo.updateMany(
      { date: { $gte: startOfWeek, $lte: today } },
      { weekTotalHours: newWeekTotal, weekStartDate: startOfWeek }
    );

    todayTracking.weekTotalHours = newWeekTotal;
    await todayTracking.save();
    res.status(200).json({
      message: "Time tracking info updated successfully!",
      totalHoursToday: todayTracking.hoursTracked,
      totalHoursThisWeek: newWeekTotal,
    });
  } catch (error) {
    console.error("Error updating time tracking info:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", message: error.message });
  }
});

app.get("/get-weekly-tracked-time", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfWeek = getStartOfWeek(today);

    const weeklyTracking = await TimeTrackingInfo.findOne({
      date: { $gte: startOfWeek, $lte: today },
    }).sort({ date: -1 });

    const weeklyTrackedTime = weeklyTracking
      ? weeklyTracking.weekTotalHours
      : 0;

    res.status(200).json({ weeklyTrackedTime: weeklyTrackedTime * 3600000 });
  } catch (error) {
    console.error("Error fetching weekly tracked time:", error);
    res.status(500).send("Internal Server Error");
  }
});
app.get("/get-last-tracked-time", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfWeek = getStartOfWeek(today);

    const lastTracking = await TimeTrackingInfo.findOne({
      date: { $gte: startOfWeek, $lte: today },
    }).sort({ date: -1 });

    const lastTrackedTime = lastTracking
      ? lastTracking.hoursTracked * 3600000
      : 0;

    res.status(200).json({ lastTrackedTime });
  } catch (error) {
    console.error("Error fetching last tracked time:", error);
    res.status(500).send("Internal Server Error");
  }
});
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
