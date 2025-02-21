const axios = require('axios');
const MergedData = require('../models/MergedData');
const AllData = require('../services/AllData');
 
// Function to fetch and store the merged data
const processAndStoreData = async (req, res) => {
  try {
    const allData = AllData.getAllData();
    console.log(allData);
    
    
    const event = allData.event || [];  
    const bPlaceorder = allData.backplaceorder || {};  
    const Lplaceorder = allData.layplaceorder || {};  
    // const profitLoss=allData.profit.result.clearedOrders;
    
    const strategies=allData.strategy;
    console.log("Strategy", strategies);
    
    const eId=allData.eventId;
    const mId=allData.marketId; 
    console.log("Market Id" , mId);
    
    let MatchName,PlayerName,proLoss,eventName;
    
    
    const match = allData.matchh.result;
    console.log("Back placeorder" , bPlaceorder);
    console.log("LayPlaceorde", Lplaceorder);
    
    
    match.forEach((i) => {
        if (i.marketId === mId) {
            // Add optional chaining to prevent errors if properties don't exist
            MatchName = i.competition?.name;
            PlayerName = i.runners?.[0]?.runnerName;
            console.log("HEEE", i.competition?.name);
            console.log(i.runners?.[0]?.runnerName);
        }
    });
    const side = bPlaceorder.result.instructionReports[0].instruction.side; 
    //fetch profit
    // profitLoss.forEach((i)=>{
    //   if(i.marketId===mId){
    //     proLoss=i.profit;
    //     console.log(i.profit);
    //   }
    // })
 
    //fetch eventname
    event.forEach((i)=>{
      if(eId===i.id){
        eventName=i.name;
      }
    })
 
    // console.log(eId,mId);
 
    // const amount=placeorder.instructionReports[0].instruction.limitOrder.size;
    const amount = Lplaceorder.result.instructionReports[0].instruction.limitOrder.size || 0;
     const odd = Lplaceorder.result.instructionReports[0].instruction.limitOrder.price || 3;
    // const amount = 0;
    // const odd = 5
    const status = bPlaceorder.result.status || "UNKNOWN_STATUS";
    const date = bPlaceorder.result.instructionReports[0].placedDate;
    // const marketId = bPlaceorder.marketId || "UNKNOWN_MARKET";

 
    const mergedData = new MergedData({
      Amount: amount,
      Match: MatchName,
      Odds : odd,
      Player: PlayerName,
      ProfitLoss: 12,
      Status: status,
      Probability : 2.33,
      Type : side,
      date: date,
      market_id: mId,
      strategy: strategies,
      Sport:eventName
    });

    console.log(mergedData);
    
    // Save the merged data to the database
    await mergedData.save();
    console.log('Data saved successfully!', mergedData);
   return res.status(200).json(mergedData);
  } catch (error) {
    console.error('Error in processing data:', error.message);
    res.status(500).json({ error: 'Failed to process data', message: error.message });
  }
};

 
module.exports = { processAndStoreData , };
 

 
 