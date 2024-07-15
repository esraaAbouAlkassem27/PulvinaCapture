const express = require("express");
const { getAllScreens } = require("../controllers/screenshotController");

const router = express.Router();

// Define the GET endpoint to fetch all documents
router.get("/screenshots", getAllScreens);

module.exports = router;
