// services/dataService.js

const MergedData = require('../models/MergedData');
const AllData = require('../services/AllData');

// Function to fetch and store the merged data
const processAndStoreData = async (req, res) => {
  try {
    const allData = AllData.getAllData();
    // console.log("Processing All Data:", allData.match);

    const mergedData = new MergedData({
      Amount: "235",
      Match: "Hehe",
      Odds: 235,
      Player: "Shweta",
      ProfitLoss: 56,
      Status: "Hehe",
      Type: "WIN",
      date: "5 Feb 2025",
      market_id: 563,
      strategy: "Hehehe",
      Sport: "cricket"
    });

    // Save the merged data to the database
    await mergedData.save();
    console.log('Data saved successfully!', mergedData);
  } catch (error) {
    console.error('Error in processing data:', error.message);
  }
};

// Now, execute the function after AllData is fully loaded
processAndStoreData(AllData);

module.exports = { processAndStoreData };
