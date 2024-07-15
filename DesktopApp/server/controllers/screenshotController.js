const Screenshot = require("../models/Screenshot");

// Controller to get all documents
const getAllScreens = async (req, res) => {
  console.log("🚀 ~ getAllScreens ~ req:", req);
  try {
    const Screenshots = await Screenshot.find({});
    res.status(200).json(Screenshots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllScreens,
};
