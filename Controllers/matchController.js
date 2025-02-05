const createClient = require('../services/Client');
const getToken = require('../Controllers/authController');
const AllData=require('../services/AllData')
const fetchMatch = async (req,res) => {
  try {
    const {eventId,competitionId} = req.body;
 
    if (!eventId) {
      return res.status(400).send("Id not found");
    }
 
    console.log("Event ID:", eventId);
 
    const apiData = await getToken.userLoginData();
        if (!apiData || !apiData.sessionToken) {
          return res.status(401).json({ message: 'Authentication failed. No sessionToken received.' });
        }
   
 
     const apiClient = await createClient(apiData.sessionToken);
    // Define API URL and request payload
    const apiUrl = process.env.API_BASE_URL || "https://api.betfair.com/exchange/betting/json-rpc/v1";
 
    const requestPayload = {
      jsonrpc: '2.0',
      method: 'SportsAPING/v1.0/listMarketCatalogue',
      params: {
        filter: {
          eventTypeIds: [eventId],
          competitionIds:[competitionId],
          marketStartTime: { from: new Date().toISOString()},
        },
        sort: 'FIRST_TO_START',
        maxResults: 100,
        inPlayOnly:"false",
        marketTypeCodes:["MATCH_ODDS"],
        marketProjection:["RUNNER_METADATA" , "COMPETITION" , "MARKET_START_TIME"]
      },
      id:1,
    };
 
    // Make the API request to fetch tournament data
    const response = await apiClient.post(apiUrl, requestPayload);
    const data=response.data;
 
    AllData.match(data);
    // Return the response data to the client
    res.status(200).json(response.data);
 
  } catch (error) {
    console.error('Match Fetch Error:', error.message);
 
    if (error.response) {
      // If the error has a response from the API, log additional info
      console.error('API Response Error:', error.response.data);
      console.error('Status Code:', error.response.status);
    }
 
    // Send a response to the client indicating an error
    res.status(500).json({
      error: 'Failed to fetch tournament data',
      message: error.message,
    });
  }
};
 
module.exports = { fetchMatch };