const express = require("express");
const {
  getAllScreens,
  getTimeTrackingForDay,
} = require("../controllers/screenshotController");

const router = express.Router();

// Define the GET endpoint to fetch all documents
router.get("/screenshots", getAllScreens);
router.get("/day/:date", getTimeTrackingForDay);

module.exports = router;
