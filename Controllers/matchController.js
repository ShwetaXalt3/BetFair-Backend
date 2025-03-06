const axios = require('axios')
const AllData = require('../services/AllData');

const fetchMatch = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(400).json({ message: 'Missing or invalid authorization header' });
    }
   
    const sessionToken = authHeader.split(' ')[1];

    // const { eventId, competitionId , amount , strategies } = req.body;
    const {eventId , competitionId} = req.body;
    if (!eventId || !competitionId) {
      return res.status(400).send("Event ID or Competition ID not found");
    }
    
    const apiUrl = process.env.API_BASE_URL || "https://api.betfair.com/exchange/betting/json-rpc/v1";

    // Store event and competition data
    AllData.setEventCompetition(eventId, competitionId);

    const targetDate = new Date();
    const marketStartTime = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate(), 0, 0, 0));
    const formattedMarketStartTime = marketStartTime.toISOString().split('.')[0] + "Z";

    const marketEndTime = new Date(marketStartTime);
    marketEndTime.setUTCDate(marketEndTime.getUTCDate() + 1);
    const formattedMarketEndTime = marketEndTime.toISOString().split('.')[0] + "Z";

    // Request payload for fetching market data
    const requestPayload = {
      jsonrpc: '2.0',
      method: 'SportsAPING/v1.0/listMarketCatalogue',
      params: {
        filter: {
          eventTypeIds: [eventId],
          competitionIds: [competitionId],
          marketStartTime: { from: formattedMarketStartTime, to: formattedMarketEndTime },
          marketTypeCodes: ['MATCH_ODDS'],
          inPlayOnly: "true",
          sort :"FIRST_TO_START"
        },
        marketProjection: ["RUNNER_METADATA", "COMPETITION", "MARKET_START_TIME"],
        locale: "en",
        maxResults: 100,
      },
      id: 1,
    };

    // Fetch market data                 
    const response = await axios.post(apiUrl, requestPayload, {
      headers: {
        'X-Application': process.env.API_KEY,    
        'Content-Type': 'application/json',    
        'X-Authentication': sessionToken,      
      }
    });
    const marketData = response.data.result;

    if (!Array.isArray(marketData)) {
      console.error("Unexpected API response:", marketData);
      return res.status(500).json({ message: "Unexpected API response format." });
    }
    const filteredResponse = marketData.filter(market =>       market.runners.every(runner => !runner.runnerName.includes('/'))).map(market => ({ ...market,      runners: market.runners.filter(runner => !runner.runnerName.includes('/')) }));
    // Process the data to match the desired format
    const formattedResponse = {
      market_catalogue: marketData.map(market => ({
        amount: 0, 
        competition: {
          id: market.competition?.id || "",
          name: market.competition?.name || "",
        },
        marketId: market.marketId,
        marketName: market.marketName,
        runners: market.runners.map(runner => ({
          handicap: runner.handicap,
          metadata: {
            runnerId: String(runner.selectionId),
          },
          runnerName: runner.runnerName,
          selectionId: runner.selectionId,
          sortPriority: runner.sortPriority,
        })),
        strategies: "strategies", // Default strategy
        totalMatched: market.totalMatched || 0,
      })),
    };

    // Store match data
    AllData.setEventCompetition(eventId , competitionId);
    AllData.match(formattedResponse);
    AllData.matchh(response.data)

    // Return formatted response
    // res.status(200).json(formattedResponse);
    res.status(200).json(filteredResponse)
  } catch (error) {
    console.error('Match Fetch Error:', error.message);
    if (error.response) {
      console.error('API Response Error:', error.response.data);
      console.error('Status Code:', error.response.status);
    }
    res.status(500).json({
      error: 'Failed to fetch match data',
      message: error.message,
    });
  }
};

const getMatch = ()=>{
     console.log("from match");
     
}

module.exports = { fetchMatch , getMatch };
