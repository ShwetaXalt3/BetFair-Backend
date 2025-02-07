const createClient = require('../services/Client');
const getToken = require('./authController');
const AllData = require('../services/AllData');

const fetchProbability = async (req, res) => {
  try {
    const { amount, strategies, marketData } = req.body;
    console.log(amount, strategies);

    if (!marketData || !Array.isArray(marketData)) {
      return res.status(400).json({ message: 'Invalid or missing marketData array' });
    }

    const apiData = await getToken.userLoginData();
    if (!apiData || !apiData.sessionToken) {
      return res.status(401).json({ message: 'Authentication failed. No sessionToken received.' });
    }

    const apiClient = await createClient(apiData.sessionToken);
    const apiUrl = "http://127.0.0.1:5002/fetch_particular_match";

    // Constructing formatted response as payload
    const requestPayload = {
      data: {
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
          strategies: strategies,
          totalMatched: market.totalMatched || 0,
        })),
      },
    };

    const response = await apiClient.post(apiUrl, requestPayload);
    const data = response.data;

    // Optionally store the processed data
    AllData.match(data);
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Fetch Probability Error:', error.message);
    if (error.response) {
      console.error('API Response Error:', error.response.data);
      console.error('Status Code:', error.response.status);
    }

    res.status(500).json({
      error: 'Failed to fetch probability data',
      message: error.message,
    });
  }
};

module.exports = { fetchProbability };