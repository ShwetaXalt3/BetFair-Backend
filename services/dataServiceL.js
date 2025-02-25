const axios = require('axios');
const MergedData = require('../models/MergedData');
const AllData = require('../services/AllData');
 
// Function to fetch and store the merged data
const processAndStoreData = async (req, res) => {
  try {
      
      const allData = AllData.getAllData();
      
      const event = allData.event ;  
      const layplaceorder = allData.layplaceorder;  
      const prob = allData.probability;    
      const match = allData.matchh.result;
      const strategies=allData.strategy; 
      const amnt = allData.amount;  
      const eId=allData.eventId;      
      const mId = layplaceorder.result.marketId;
    const Lp = layplaceorder.result.instructionReports[0].instruction.limitOrder.price
    const sId = layplaceorder.result.instructionReports[0].instruction.selectionId;
    console.log("Market" , mId);
    console.log("Selection" , sId);

    
   
    
    let MatchName,PlayerName,proLoss,eventName;
    
    if (match && Array.isArray(match)) {
      match.forEach((i) => {
        if (i.marketId === mId) {  // Only process the correct market
          MatchName = i.competition?.name || "Unknown Match";
    
    
          if (i.runners && Array.isArray(i.runners)) {
            const player = i.runners.find(runner => runner.selectionId === sId);
            
            if (player) {
              PlayerName = player.runnerName;
            } else {
              console.log(`Selection ID ${sId} NOT found in Market ID ${mId}`);
            }
          }
        }
      });
    }
    console.log("match name" , MatchName);
    console.log("player name" , PlayerName);
    
    
    


    const side = layplaceorder.result.instructionReports[0].instruction.side; 
 
    event.forEach((i)=>{
      if(eId===i.id){
        eventName=i.name;
      }
    })
 
 
    const amount = amnt;
  
    var status = layplaceorder.result.status;
    const date = layplaceorder.result.instructionReports[0].placedDate;
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
         ProfitLoss: 0,
         Status: status,
         Probability : 2.33,
         Type : side,
         date: date,
         market_id: mId,
         strategy: strategies,
         Sport:eventName
       });
   
      
       
      
       await mergedData.save();
       console.log("data saveddd");
       console.log(mergedData);

       return res.status(200).json(mergedData);

    }
  } catch (error) {
    console.error('Error in processing data:', error.message);
    res.status(500).json({ error: 'Failed to process data', message: error.message });
  }
};

 
module.exports = { processAndStoreData};
 

 
 