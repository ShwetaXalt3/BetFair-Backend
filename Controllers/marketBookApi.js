const axios = require('axios');

const fetchMarketBook = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
 
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(400).json({ message: 'Missing or invalid authorization header' });
        }
        const sessionToken = authHeader.split(' ')[1];

        const {marketId} = req.body;
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

    
        
        return res.status(200).json(response.data); 

    } catch (err) {
        console.error("Error fetching market data:", err.response ? err.response.data : err.message);
        return res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};

module.exports = { fetchMarketBook };
