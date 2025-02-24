const axios = require('axios');
const MergedData = require('../models/MergedData');
const AllData = require('../services/AllData');
 
// Function to fetch and store the merged data
const processAndStoreData = async (req, res) => {
  try {
    const allData = AllData.getAllData();
    // console.log(allData);
    const event = allData.event ;  
    const bPlaceorder = allData.backplaceorder;  
    const Lplaceorder = allData.layplaceorder;  
    const prob = allData.probability;    
    const match = allData.matchh.result;
    const strategies=allData.strategy; 
    const amnt = allData.amount;  
    const eId=allData.eventId;
    const mId=allData.marketId; 
    const sId = bPlaceorder.result.instructionReports[0].instruction.selectionId;
    
    let MatchName,PlayerName,proLoss,eventName;
    
     match.forEach((i) => {
      if (i.marketId === mId) {
        MatchName = i.competition?.name; 

        const player = i.runners.find(runner => runner.selectionId === sId);
        
        if (player) {
            PlayerName = player.runnerName;
        }
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
 
    event.forEach((i)=>{
      if(eId===i.id){
        eventName=i.name;
      }
    })
 
 
    // const amount=placeorder.instructionReports[0].instruction.limitOrder.size;
    //  const amount = Lplaceorder.result.instructionReports[0].instruction.limitOrder.size;
    const amount = amnt;
    //  const odd = Lplaceorder.result.instructionReports[0].instruction.limitOrder.price;
    // const amount = 0;
    // const odd = 5
    var status = bPlaceorder.result.status;
    const date = bPlaceorder.result.instructionReports[0].placedDate;
    if(status==="SUCCESS"){
      status="Matched";
    }
    else{
      status="Unmatched";
    }
    
    if(!amount && !MatchName && !odd && !PlayerName && !status && !side && !date && !mId && !strategies && !eventName){
      res.status(400).json({message :  "Unable to save data into database"})
    }else{
      
       const mergedData = new MergedData({
         Amount: amount,
         Match: MatchName,
         Odds : 0,
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

    }
  } catch (error) {
    console.error('Error in processing data:', error.message);
    res.status(500).json({ error: 'Failed to process data', message: error.message });
  }
};

 
module.exports = { processAndStoreData , };
 

 
 