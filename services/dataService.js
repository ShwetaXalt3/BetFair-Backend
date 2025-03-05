const axios = require('axios');
const MergedData = require('../models/MergedData');
const AllData = require('../services/AllData');
const TempBet = require('../models/TempSchema');

const processAndStoreData = async (req, res) => {
  try {
    const allData = AllData.getAllData();
    const event = allData.event;
    const bPlaceorder = allData.backplaceorder;
    const match = allData.matchh.result;
    const strategies = allData.strategy;
    const eId = allData.eventId;
    const mId = bPlaceorder.result.marketId;

    const sId = bPlaceorder.result.instructionReports[0].instruction.selectionId;
    const Lp = allData.lastPriceTraded;

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

    const amount = allData.BackAmount;
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
      strategy: strategies
    });

    await tempBackBet.save();

    // Create an unmatched LAY copy with null amount
    const tempLayBet = new TempBet({
      marketId: mId,
      selectionId: sId,
      amount: null,
      odds: Lp,
      side: 'LAY',
      status: 'UNMATCHED',
      matchName: MatchName,
      playerName: PlayerName,
      eventName: eventName,
      strategy: strategies
    });

    await tempLayBet.save();

    // Permanent record creation remains the same
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
      Sport: eventName
    });

    await mergedData.save();

    return res.status(200).json({ 
      tempBackBet, 
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

module.exports = { processAndStoreData };