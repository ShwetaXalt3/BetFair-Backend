const createClient = require('../services/Client');
const getToken = require('../Controllers/authController');
const AllData = require('../services/AllData');

const fetchMatch = async (req, res) => {
  try {
    const { eventId, competitionId , amount , strategies } = req.body;
    if (!eventId || !competitionId) {
      return res.status(400).send("Event ID or Competition ID not found");
    }

    // Get API session token
    const apiData = await getToken.userLoginData();
    if (!apiData || !apiData.sessionToken) {
      return res.status(401).json({ message: 'Authentication failed. No sessionToken received.' });
    }

    const apiClient = await createClient(apiData.sessionToken);
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
          inPlayOnly: "false",
        },
        marketProjection: ["RUNNER_METADATA", "COMPETITION", "MARKET_START_TIME"],
        locale: "en",
        maxResults: 100,
      },
      id: 1,
    };

    // Fetch market data
    const response = await apiClient.post(apiUrl, requestPayload);
    const marketData = response.data.result;

    if (!Array.isArray(marketData)) {
      console.error("Unexpected API response:", marketData);
      return res.status(500).json({ message: "Unexpected API response format." });
    }

    // Process the data to match the desired format
    const formattedResponse = {
      market_catalogue: marketData.map(market => ({
        amount: amount, 
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
        strategies: strategies, // Default strategy
        totalMatched: market.totalMatched || 0,
      })),
    };

    // Store match data
    AllData.match(marketData);

    // Return formatted response
    res.status(200).json(formattedResponse);
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

module.exports = { fetchMatch };
