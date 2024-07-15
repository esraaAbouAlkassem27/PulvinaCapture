const mongoose = require("mongoose");
const screenshotSchema = mongoose.Schema({
  projectName: String,
  screenshot: Buffer,
  timestamp: Date,
  mouseMovements: Array,
  keyPresses: Array,
});

const Screenshot = mongoose.model("Screenshot", screenshotSchema);

module.exports = Screenshot;
