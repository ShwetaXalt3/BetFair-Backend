// services/dataService.js

const MergedData = require('../models/MergedData');
const AllData = require('../services/AllData');

// Function to fetch and store the merged data
const processAndStoreData = async (req, res) => {
  try {
    const allData = AllData.getAllData();
    const eventData = allData.event;
    const tournamentData = allData.tournament;
    const matchData = allData.match;
    const fundsData = allData.funds;
    const {eventId , competitionId} = AllData.getEventCompetition();

    // console.log(eventId);
    // console.log(competitionId);

    
    // console.log(matchData.result);
    const maping = tournamentData.result;
    maping.map((i)=>{
      console.log(i.competition.id);
      
    })
     


    const mergedData = new MergedData({
      Amount: "1000", 
      Match: "T20",
      Odds: 235,
      Player: "Tisha",
      ProfitLoss: 500,
      Status: "Pending",
      Type: "WIN",
      date: "15 Feb 2004",
      market_id: 154,
      strategy: "Strategy-4",
      Sport: eventData.result[tournamentData.id-1].eventType.name
    });

    // Save the merged data to the database
    // await mergedData.save();
    console.log('Data saved successfully!', mergedData);
    res.status(200).json(mergedData);
  } catch (error) {
    console.error('Error in processing data:', error.message);
  }
};
processAndStoreData(AllData);

module.exports = { processAndStoreData };
