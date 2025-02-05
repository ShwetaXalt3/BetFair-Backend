const createClient = require('../services/Client');
const getToken = require('../Controllers/authController');
const  AllData  = require('../services/AllData');
 
const fetchEvent = async (req, res) => {
  try {
    const apiData = await getToken.userLoginData();
    if (!apiData || !apiData.sessionToken) {
      return res.status(401).json({ message: 'Authentication failed. No sessionToken received.' });
    }
 
    const apiClient = await createClient(apiData.sessionToken);
    const apiUrl = process.env.API_BASE_URL || "https://api.betfair.com/exchange/betting/json-rpc/v1";
 
    const requestPayload = {
      jsonrpc: '2.0',
      method: 'SportsAPING/v1.0/listEventTypes',
      params: { filter: {} },
    };
     
    const response = await apiClient.post(apiUrl, requestPayload);
    if(!response || !response.data){
      throw new Error("Invalid response the api")
    }
        const eventData = response.data ;
        AllData.event(eventData)
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching event data:', error.message);
    if (error.response) {
      console.error('API Response Error:', error.response.data);
    }
    res.status(error.response?.status || 500).json({
      message: 'Failed to fetch event data',
      error: error.response?.data || error.message,
    });
  }
};
console.log(fetchEvent);

 
module.exports = { fetchEvent };