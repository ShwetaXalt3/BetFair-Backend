const axios = require('axios');
const MergedData = require('../models/MergedData');
const AllData = require('../services/AllData');
const TempBet = require('../models/TempSchema');

const processAndStoreData = async (req, res) => {
  try {
    const allData = AllData.getAllData();
    const event = allData.event;
    const layplaceorder = allData.layplaceorder;
    const match = allData.matchh.result;
    const strategies = allData.strategy;
    const eId = allData.eventId;
    const mId = layplaceorder.result.marketId;

    const sId = layplaceorder.result.instructionReports[0].instruction.selectionId;
    const Lp = layplaceorder.result.instructionReports[0].instruction.limitOrder.price;
    const Lay_amount = layplaceorder.result.instructionReports[0].instruction.limitOrder.size;

    let MatchName, PlayerName, eventName;

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

    event.forEach((i) => {
      if (eId === i.id) {
        eventName = i.name;
      }
    });

    const side = layplaceorder.result.instructionReports[0].instruction.side;
    const date = layplaceorder.result.instructionReports[0].placedDate;

    // Find the corresponding temporary back bet
    const tempBackBet = await TempBet.findOne({
      marketId: mId,
      selectionId: sId,
      side: 'BACK'
    });

    if (!tempBackBet) {
      return res.status(400).json({ message: "No corresponding back bet found" });
    }

    // Create lay bet entry with initial unmatched status
    const tempLayBet = new TempBet({
      marketId: mId,
      selectionId: sId,
      amount: Lay_amount, // Initially null
      odds: Lp,
      side: 'LAY',
      status: 'UNMATCHED',
      matchName: MatchName,
      playerName: PlayerName,
      eventName: eventName,
      strategy: strategies
    });

    await tempLayBet.save();

    // Create a permanent record for the lay bet
    const mergedData = new MergedData({
      Amount: Lay_amount,
      Match: MatchName,
      Odds: Lp,
      Player: PlayerName,
      Status: 'UNMATCHED',
      Type: side,
      date: date,
      market_id: mId,
      strategy: strategies,
      Sport: eventName
    });

    await mergedData.save();

    return res.status(200).json({ 
      tempLayBet, 
      mergedData 
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to process data', 
      message: error.message 
    });
  }
};

// New function to complete the bet
const completeBet = async (req, res) => {
  try {
    const { marketId, selectionId, layStake, layPrice} = req.body;

    // Find the temporary back and lay bets
    const tempBackBet = await TempBet.findOne({ 
      marketId, 
      selectionId, 
      side: 'BACK' 
    });

    const tempLayBet = await TempBet.findOne({ 
      marketId, 
      selectionId, 
      side: 'LAY' 
    });

    // if (!tempBackBet || !tempLayBet) {
    //   return res.status(404).json({ message: "Bet not found" });
    // }

    // Calculate profit/loss
    const backAmount = tempBackBet.amount;
    const backPrice = tempBackBet.odds;
    const profitLoss = backAmount - layStake;

    // Create a final record for the LAY bet with updated details
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
      "Profit/Loss": profitLoss
    });

    await mergedLayData.save();

    // Optionally, update the existing back bet record with profit/loss
    await MergedData.findOneAndUpdate(
      { 
        market_id: marketId, 
        Type: 'BACK' 
      },
      { 
        "Profit/Loss": profitLoss 
      }
    );

    // Delete temporary bets
    await TempBet.deleteMany({ 
      marketId, 
      selectionId 
    });

    return res.status(200).json({ 
      message: "Bet completed successfully", 
      layBetData: mergedLayData,
      exitReason 
    });

  } catch (error) {
    console.error("Error completing bet:", error);
    res.status(500).json({ 
      error: 'Failed to complete bet', 
      message: error.message 
    });
  }
};
module.exports = { 
  processAndStoreData,
  completeBet 
};