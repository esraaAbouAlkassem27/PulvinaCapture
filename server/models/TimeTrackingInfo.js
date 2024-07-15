const mongoose = require("mongoose");

const timeTrackingInfoSchema = new mongoose.Schema({
  date: { type: Date, required: true, unique: true },
  hoursTracked: { type: Number, required: true, default: 0 },
  weekStartDate: { type: Date, required: true },
  weekTotalHours: { type: Number, required: true, default: 0 },
});

const TimeTrackingInfo = mongoose.model(
  "TimeTrackingInfo",
  timeTrackingInfoSchema
);

module.exports = TimeTrackingInfo;
