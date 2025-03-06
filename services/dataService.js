const axios = require('axios');
const MergedData = require('../models/MergedData');
const AllData = require('../services/AllData');
const TempBet = require('../models/TempSchema');

const processAndStoreBackBet = async (sessionToken, backBetData) => {
  try {
    const allData = AllData.getAllData();
    const event = allData.event;
    const bPlaceorder = backBetData.backResponse;
    const match = allData.matchh.result;
    const strategies = allData.strategy;
    const eId = allData.eventId;
    const mId = bPlaceorder.result.marketId;

    const sId = bPlaceorder.result.instructionReports[0].instruction.selectionId;
    const Lp = backBetData.backBetPrice;

    let MatchName, PlayerName, eventName;

    // Find match details
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
            }
          }
        }
      });
    }

    // Find event name
    event.forEach((i) => {
      if (eId === i.id) {
        eventName = i.name;
      }
    });

    const amount = backBetData.backStake;
    const side = bPlaceorder.result.instructionReports[0].instruction.side;
    const date = bPlaceorder.result.instructionReports[0].placedDate;

    // Create and save temporary back bet (MATCHED)
    const tempBackBet = new TempBet({
      marketId: mId,
      selectionId: sId,
      amount: amount,
      odds: Lp,
      side: 'BACK',
      status: 'MATCHED',
      matchName: MatchName,
      playerName: PlayerName,
      eventName: eventName,
      strategy: strategies,
      betId : bPlaceorder.result.instructionReports[0].betId
    });

    await tempBackBet.save();

    // Create an unmatched LAY copy with null amount and odds
    const tempLayBet = new TempBet({
      marketId: mId,
      selectionId: sId,
      amount: null,
      odds: null,
      side: 'LAY',
      status: 'UNMATCHED',
      matchName: MatchName,
      playerName: PlayerName,
      eventName: eventName,
      strategy: strategies,
      betId : null

    });

    await tempLayBet.save();

    // Permanent record creation
    const mergedData = new MergedData({
      Amount: amount,
      Match: MatchName,
      Odds: Lp,
      Player: PlayerName,
      Status: 'MATCHED',
      Type: side,
      date: date,
      market_id: mId,
      strategy: strategies,
      Sport: eventName,
      betId : bPlaceorder.result.instructionReports[0].betId
    });

    await mergedData.save();
    console.log("merged data", mergedData);
    
    

    // return { 
    //   tempBackBet, 
    //   tempLayBet,
    //   mergedData 
    // };
    return ;

  } catch (error) {
    console.error('Error processing back bet:', error);
    throw error;
  }
};

const processAndStoreLayBet = async (layBetData) => {

  console.log("from data service -----------------------" , layBetData);
  
  try {

   
    const marketId = layBetData.trackingData.marketId;
    const selectionId = layBetData.trackingData.selectionId;
    const layStake = layBetData.layResponse.result.instructionReports[0].instruction.limitOrder.size;
    const layPrice = layBetData.trackingData.layPrice;

    
    

    
    

    // Find the corresponding temporary bets
    const tempBackBet = await TempBet.findOne({
      marketId,
      selectionId,
      side: 'BACK'
    });
    // console.log("Tempback bet ", tempBackBet);
    

    const tempLayBet = await TempBet.findOne({
      marketId,
      selectionId,
      side: 'LAY',
      status: 'UNMATCHED'    
    });

    // console.log("Templay bet ", tempLayBet);


    // if (!tempBackBet || !tempLayBet) {
    //   throw new Error("Corresponding back or lay bet not found");
    // }

    // Calculate profit/loss
    // const profitLoss = tempBackBet.amount - layStake;

    // Update LAY temporary bet
   
    tempLayBet.status = 'MATCHED';
    tempLayBet.amount = layStake;
    tempLayBet.odds = layPrice;
    tempLayBet.betId = layBetData.layResponse.result.instructionReports[0].betId;
    await tempLayBet.save();

    // Create final merged data for LAY bet
    const mergedLayData = new MergedData({
      Amount: layStake,
      Match: tempBackBet.matchName,
      Odds: layPrice,
      Player: tempBackBet.playerName,
      Status: 'MATCHED',
      Type: 'LAY',
      date: new Date().toISOString(),
      market_id: marketId,
      strategy: tempBackBet.strategy,
      Sport: tempBackBet.eventName,
      betId : layBetData.layResponse.result.instructionReports[0].betId
      // "Profit/Loss": profitLoss
    });

     await mergedLayData.save();

    // // Update back bet record with profit/loss
    // await MergedData.findOneAndUpdate(
    //   { 
    //     market_id: marketId, 
    //     Type: 'BACK' 
    //   },
    //   { 
    //     "Profit/Loss": profitLoss 
    //   }
    // );
    

    // // Delete temporary bets
    // await TempBet.deleteMany({ 
    //   marketId, 
    //   selectionId 
    // });

    // return { 
    //   mergedLayData,
    //   tempLayBet,
    //   profitLoss
    // };

  } catch (error) {
    console.error('Error processing lay bet:', error);
    throw error;
  }
};


// const processAndStoreLayBet = async(layBetData)=>{
//   console.log("from data service -----------------------" );
  
// }
module.exports = { 
  processAndStoreBackBet,
  processAndStoreLayBet
};