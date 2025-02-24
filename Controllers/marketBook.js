const axios = require('axios');
const AllData = require('../services/AllData');

const fetchMarketBook = async (sessionToken, marketId) => {
    try {
        if (!sessionToken) {
            throw new Error('Missing session token');
        }
        if (!marketId) {
            throw new Error('Missing marketId');
        }

        const apiUrl = process.env.API_BASE_URL || "https://api.betfair.com/exchange/betting/json-rpc/v1";

        const payload = {
            jsonrpc: '2.0',
            method: "SportsAPING/v1.0/listMarketBook",
            params: {
                marketIds: [marketId],
                priceProjection: {
                    priceData: ["EX_BEST_OFFERS"]
                }
            },  
            id: 1
        };

        const response = await axios.post(apiUrl, payload, {
            headers: {
                'X-Application': process.env.API_KEY,
                'Content-Type': 'application/json',
                'X-Authentication': sessionToken,
            }
        });

        //  console.log("Market Book Data:", JSON.stringify(response.data, null, 2));
        AllData.market(response.data);  // Save market data (optional)
        // console.log("from market book ", response.data);
        
        return response.data; // Return market data

    } catch (err) {
        console.error("Error fetching market data:", err.response ? err.response.data : err.message);
        throw err; // Let the calling function handle the error
    }
};

module.exports = { fetchMarketBook };
