const axios = require('axios');
const MergedData = require('../models/MergedData');
const AllData = require('../services/AllData');
 
// Function to fetch and store the merged data
const processAndStoreData = async (req, res) => {
  try {
    const allData = AllData.getAllData();
    const placeorder=allData.placeorder;
    const match=allData.matchh.result;
    const profitLoss=allData.profit.result.clearedOrders;
    const event=allData.event;
    const strategies=allData.strategy;
 
    const eId=allData.eventId;
    const mId=placeorder.marketId;
    // console.log(profitLoss);
 
    let MatchName,PlayerName,proLoss,eventName;
 
    //fetch match and player name
    match.forEach((i) => {
       if((i.marketId)===mId){
        MatchName=i.competition.name;
        PlayerName=i.runners[0].runnerName;
        console.log(i.competition.name);
        console.log(i.runners[0].runnerName);
       }
    });
   
    //fetch profit
    profitLoss.forEach((i)=>{
      if(i.marketId===mId){
        proLoss=i.profit;
        console.log(i.profit);
      }
    })
 
    //fetch eventname
    event.forEach((i)=>{
      if(eId===i.id){
        eventName=i.name;
      }
    })
 
    console.log(eId,mId);
 
    const amount=placeorder.instructionReports[0].instruction.limitOrder.size;
    const odd=placeorder.instructionReports[0].instruction.limitOrder.price;
    const status=placeorder.status;
    const date=placeorder.instructionReports[0].placedDate;
    const marketId=placeorder.marketId;
 
    const mergedData = new MergedData({
      Amount: amount,
      Match: MatchName,
      Odds : odd,
      Player: PlayerName,
      ProfitLoss: proLoss,
      Status: status,
      Probability : 2.33,
      date: date,
      market_id: marketId,
      strategy: strategies,
      Sport:eventName
    });
 
    // Save the merged data to the database
    await mergedData.save();
    console.log('Data saved successfully!', mergedData);
    res.status(200).json(mergedData);
  } catch (error) {
    console.error('Error in processing data:', error.message);
    res.status(500).json({ error: 'Failed to process data', message: error.message });
  }
};
 
module.exports = { processAndStoreData };
 
 
 