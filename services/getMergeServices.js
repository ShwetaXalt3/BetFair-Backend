const MergedData = require('../models/MergedData');
  const getMergedData = async (req, res) => {
    try {
      const mergedData = await MergedData.find();
      res.status(200).json(mergedData);
    } catch (error) {
      console.error('Error fetching merged data:', error.message);
      res.status(500).json({ error: 'Failed to fetch data', message: error.message });
    }
  };
  module.exports = {getMergedData};