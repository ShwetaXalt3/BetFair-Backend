const axios = require('axios');
const MergedData = require('../models/MergedData');
const AllData = require('../services/AllData');
 
// Function to fetch and store the merged data
const processAndStoreData = async (req, res) => {
  try {
   
    const allData = AllData.getAllData();
    const event = allData.event ;  
    const bPlaceorder = allData.backplaceorder;  
    const prob = allData.probability;    
    const match = allData.matchh.result;
    const strategies=allData.strategy;
    const amnt = allData.amount;  
    const eId=allData.eventId;
    const mId = bPlaceorder.result.marketId;
   
    const sId = bPlaceorder.result.instructionReports[0].instruction.selectionId;
    const Lp = allData.lastPriceTraded;
 
    console.log( "-----------------------", bPlaceorder);
    // console.log(mId , sId );
    
   
   
 
   
   
    let MatchName,PlayerName,proLoss,eventName;
   
    if (match && Array.isArray(match)) {
      match.forEach((i) => {
        if (i.marketId === mId) {  
         
          const runners = i.runners || [];
          const runnerNames = runners.map(runner => runner.runnerName);
    
        
          const newMatchName = runnerNames.join(' Vs ');
    
          MatchName = newMatchName || "Unknown Match";
    
          if (runners && Array.isArray(runners)) {
            const player = runners.find(runner => runner.selectionId === sId);
    
            if (player) {
              PlayerName = player.runnerName;
            } else {
              console.log(`Selection ID ${sId} NOT found in Market ID ${mId}`);
            }
          }
        }
      });
    }
   
   
 
 
    const side = bPlaceorder.result.instructionReports[0].instruction.side;
 
    event.forEach((i)=>{
      if(eId===i.id){
        eventName=i.name;
      }
    })
 
 
    const amount = allData.BackAmount;
 
    var status = bPlaceorder.result.status;
    const date = bPlaceorder.result.instructionReports[0].placedDate;
    const utcDate = new Date(date);
    const mexicoTimeOptions = { 
      timeZone: 'America/Mexico_City', 
      year: 'numeric', 
      month: 'numeric', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: 'numeric', 
      second: 'numeric' 
    };
    const mexicoTime = utcDate.toLocaleString('en-US', mexicoTimeOptions);
    // console.log('Mexico City time:', mexicoTime);
        

    if(status==="SUCCESS"){
      status="Matched";
    }
    else{
      status="Unmatched";
    }
   
    if(!amount && !MatchName && !odd && !PlayerName && !status && !side && !date && !mId && !strategies && !eventName){
      return res.status(400).json({message :  "Unable to save data into database"})
    }
    else{
     
       const mergedData = new MergedData({
         Amount: amount,
         Match: MatchName,
         Odds : Lp,
         Player: PlayerName,
        //  "Profit/Loss": 0,
         Status: status,
        //  Probability : 2.33,
         Type : side,
         date: date,
         market_id: mId,
         strategy: strategies,
         Sport:eventName
       });
   
     
       
     
       console.log("-----------------------",mergedData);
       await mergedData.save();
       
       console.log("Data save");
       
       return res.status(200).json(mergedData);

 
    }
  } catch (error) {
    // console.error('Error in processing data:', error.message);
    res.status(500).json({ error: 'Failed to process data', message: error.message });
  }
};
 
 
module.exports = { processAndStoreData , };
 
 
 
 
 