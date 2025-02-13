const axios = require('axios');
const MergedData = require('../models/MergedData');
const AllData = require('../services/AllData');

// Function to fetch and store the merged data
const processAndStoreData = async (req, res) => {
  try {
    const allData = AllData.getAllData();
    const eId = allData.eventId;
    const cId = allData.competitionId;
    const eventData = allData.event;
    const tournamentData = allData.tournament;
    const matchData = allData.match;
    // console.log(matchData);
    // console.log("Event Id",eId);
    // console.log("Comp",cId);
    

    //   let sportName = "";
    // eventData.map((i)=>{
    //   if(i.eventType.id === tournamentData.id){
    //     sportName = i.eventType.name
    //   }
    // })
  // console.log(sportName);
    const mergedData = new MergedData({
      Amount: 0, 
      // Match: "Cricket",
      layOdds: 235, 
      backOdds : 2.33,
      Player: "Rishika",
      ProfitLoss: 500,
      // Status: "WIN",
      Probability : 2.33,
      // date: "23 Dec 2003",
      // market_id: "1.2235",
      strategy: "strategy-3",
      Sport:"ha"
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
