const axios = require('axios');
const moment = require('moment');
const AllData=require('../services/AllData')
 
const fetchProfit = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
 
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(400).json({ message: 'Missing or invalid authorization header' });
    }
 
    const sessionToken = authHeader.split(' ')[1];
    const apiUrl = process.env.API_BASE_URL || "https://api.betfair.com/exchange/betting/json-rpc/v1";
   
    // Calculate date range
    const startDate = moment().subtract(2, 'days').toISOString();
    const endDate = moment().add(2, 'days').toISOString();
 
    const requestPayload = {
      jsonrpc: "2.0",
      method: "SportsAPING/v1.0/listClearedOrders",
      params: {
        betStatus: "SETTLED",
        groupBy: "BET",
        settledDateRange: {
          from: startDate,
          to: endDate
        }
      },
      id: 1
    };
     
    const response = await axios.post(apiUrl, requestPayload, {
      headers: {
        'X-Application': process.env.API_KEY,    
        'Content-Type': 'application/json',    
        'X-Authentication': sessionToken,      
      }
    });
   
    const profitData=response.data;
    AllData.profit(profitData);
 
    if (!response || !response.data) {
      throw new Error("Invalid response from the API");
    }
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
 
module.exports = { fetchProfit };
setInterval(fetchProfit, 2 * 60 * 60 * 1000);
 