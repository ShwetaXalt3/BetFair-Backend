const MergedData = require('../models/MergedData');
const AllData = require('../services/AllData');

// Function to fetch and store the merged data
const processAndStoreData = async (req, res) => {
  try {
    const allData = AllData.getAllData();
    const eventData = allData.event;
    const tournamentData = allData.tournament;


    // Console log eventData to verify it's correctly stored
    console.log("Stored Event Data in AllData:", tournamentData.id);
      


    const mergedData = new MergedData({
      Amount: 1000, 
      Match: "Cricket",
      Odds: 235, 
      Player: "Rishika",
      ProfitLoss: 500,
      Status: "T20",
      date: "23 Dec 2003",
      market_id: "1.2235",
      strategy: "strategy-3",
      Sport: "hehe"
    });

    // Save the merged data to the database
    // await mergedData.save();

    console.log('Data saved successfully!', mergedData);
    res.status(200).json(mergedData);
  } catch (error) {
    console.error('Error in processing data:', error.message);
    res.status(500).json({ error: 'Failed to process data', message: error.message });
  }
};

module.exports = { processAndStoreData };
