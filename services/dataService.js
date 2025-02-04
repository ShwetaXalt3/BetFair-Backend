const { fetchEvent } = require('../Controllers/eventController');
// const { fetchSport } = require('../Controllers/sportController');
const { fetchTournament } = require('../Controllers/tournamentController');
const { fetchMatchStatus } = require('../Controllers/matchController');
const MergedData = require('./models/MergedData');

// Function to fetch and store the merged data
const processAndStoreData = async () => {
  try {
    // Step 1: Fetch Sport Data
    // const sport = await fetchSport(event.eventId);
    // if (!sport || !sport.sportId) {
    //   throw new Error('Sport data is incomplete or missing sportId.');
    // }

    // Step 2: Fetch Tournament Data
    const tournament = await fetchTournament(sport.sportId);
    if (!tournament || !tournament.matchName) {
      throw new Error('Tournament data is incomplete or missing matchName.');
    }

    // Step 1: Fetch Event Data
    const event = await fetchEvent();
    if (!event || !event.eventId) {
      throw new Error('Event data is incomplete or missing eventId.');
    }
    else{
      console.log("Message" , event.result[0].eventType.name);
    }
    
    // Step 4: Fetch Match Status
    const match = await fetchMatchStatus({
      matchName: tournament.matchName,
      playerName: tournament.playerName,
    });
    if (!match || !match.matchStatus) {
      throw new Error('Match data is incomplete or missing matchStatus.');
    }

    // Step 5: Merge and Save Data
    const mergedData = new MergedData({
      // username: 'admin', // Hardcoded for now, ideally fetched from the session or request
      // eventName: event.eventName,
      // eventId: event.eventId,
      // sportName: sport.sportName,
      // sportId: sport.sportId,
      // matchName: tournament.matchName,
      // playerName: tournament.playerName,
      // matchStatus: match.matchStatus,
      // profit: match.profit,
      // odds: match.odds,

      Amount: 235,
      Match: "Hehe",
      Odds: match.odds,
      Player: tournament.matchName,
      ProfitLoss: match.profit,
      Status: match.matchStatus,
      Type: "WIN",
      date: date,
      market_id: tournament.marketId,
      strategy: "Hehehe",
      Sport:sport.sportId
    });

    // Save the merged data to the database
    await mergedData.save();
    console.log('Data saved successfully!');
  } catch (error) {
    console.error('Error in processing data:', error.message);
  }
};

module.exports = { processAndStoreData };
