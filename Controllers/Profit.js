const axios = require('axios');
const moment = require('moment');
const AllData = require('../services/AllData');
const { sessionToken } = require('./authController'); // Import session token object
const MergedData = require('../models/MergedData');
const TempBet = require('../models/TempSchema');
// Function to log the profit data
const logProfitData = (data) => {
  console.log('Updated profit data at:', moment().format('YYYY-MM-DD HH:mm:ss'));
  console.log('Profit Data:', data);
};
 
const fetchProfit = async (req, res) => {
  try {
   
    if (!sessionToken.token) {
      return res.status(401).json({ message: 'Session token not found. Please login first.' });
    }
 
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
        'X-Authentication': sessionToken.token, // Use the token property
      }
    });
 
    const profitData = response.data.result.clearedOrders;
    // console.log("Profit data" , profitData);
    
 
    // // Log the profit data
    // logProfitData(profitData);
 
    // // Call the AllData service to update the data
    // AllData.profit(profitData);
 
    if (!profitData || profitData.length === 0) {
      return res.status(200).json({ message: 'No profit data found' });
    }
 
    // Loop through profit data and update the database
    for (const order of profitData) {
      const { marketId, profit , side } = order;
 
      if (!marketId) continue; // Skip if marketId is missing
 
      const updatedRecord = await MergedData.findOneAndUpdate(
        { market_id: marketId },  
        { Type: side },  
        { $set: { "Profit/Loss": profit } },  // Update the profit/loss field
      );
      const updatedTemp = await TempBet.findOneAndUpdate(
        { marketId: marketId },  
        {side: side},
        { $set: { "Profit/Loss": profit } },  // Update the profit/loss field
      );      
 
      if (updatedRecord) {
        console.log(`Updated marketId: ${marketId} with ProfitLoss: ${profit}`);
      } else {
        // console.log(`No record found for marketId: ${marketId}`);
      }

      if (updatedTemp) {
        console.log(`Updated temporary marketId: ${marketId} with ProfitLoss: ${profit}`);
        await TempBet.deleteOne({ marketId: marketId });
      } else {
        // console.log(`No record found for marketId: ${marketId}`);
      }
    }
 
    res.status(200).json({ message: 'Profit data updated successfully' });
 
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
 
setInterval(async () => {
  try {
    if (sessionToken.token) {
      console.log('Triggering scheduled fetchProfit at', moment().format('YYYY-MM-DD HH:mm:ss'));
     
      // Mock request and response objects
      const mockReq = { headers: {} };
      const mockRes = {
        status: (code) => ({
          json: (data) => {
            // Optional: log something when the scheduled job completes
            // console.log(`Scheduled job completed with status ${code}`);
          }
        })
      };
     
      await fetchProfit(mockReq, mockRes);
    } else {
      // console.log("Skipping fetchProfit: No valid session token.");
    }
  } catch (error) {
    console.error("Scheduled fetchProfit failed:", error);
  }
}, 5000);
 
module.exports = { fetchProfit };
 
 
 
 
 