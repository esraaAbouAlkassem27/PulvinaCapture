const Screenshot = require("../models/Screenshot");

// Controller to get all documents
const getAllScreens = async (req, res) => {
  console.log("🚀 ~ getAllScreens ~ req:", req);
  try {
    const { page = 1, limit = 10, date } = req.query; // Default to page 1 and limit 10
    console.log("🚀 ~ getAllScreens ~ date:", new Date(date));
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate());
    endDate.setHours(23, 59, 59, 999);
    console.log("🚀 ~ getAllScreens ~ endDate:", startDate, endDate);
    const Screenshots = await Screenshot.find({
      timestamp: {
        $gte: startDate,
        $lt: endDate,
      },
    })
      .lean()
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.status(200).json(Screenshots);
  } catch (error) {
    console.log("🚀 ~ getAllScreens ~ error:", error);
    res.status(500).json({ error: error.message });
  }
};
const TimeTrackingInfo = require("../models/TimeTrackingInfo"); // Adjust path as needed

const getTimeTrackingForDay = async (req, res) => {
  try {
    const requestedDate = new Date(req.params.date);

    // Set the time to the start of the day in UTC
    const startOfDay = new Date(
      Date.UTC(
        requestedDate.getUTCFullYear(),
        requestedDate.getUTCMonth(),
        requestedDate.getUTCDate()
      )
    );
    console.log("🚀 ~ getTimeTrackingForDay ~ startOfDay:", startOfDay);

    const endOfDay = new Date(startOfDay);
    endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

    const timeTrackingInfo = await TimeTrackingInfo.findOne({
      date: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    });

    res.json(timeTrackingInfo);
  } catch (error) {
    console.error("Error fetching time tracking info:", error);
    res.status(500).json({ message: "Error fetching time tracking info" });
  }
};

module.exports = {
  getAllScreens,
  getTimeTrackingForDay,
};
