const axios = require('axios')
 
const placeOrders = async (req, res) => {
  try {

    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(400).json({ message: 'Missing or invalid authorization header' });
    }

    const sessionToken = authHeader.split(' ')[1];

    const { selectionId, marketId, side, size, price } = req.body;
 
    // if (!selectionId || !marketId || !side || !size || !price) {
    //   return res.status(400).json({ message: 'Missing required parameters in request body' });
    // }
    console.log(selectionId, marketId, side, size, price);
    
    
 
    // const token = apiData.sessionToken;
    const apiUrl = process.env.API_BASE_URL || "https://api.betfair.com/exchange/betting/json-rpc/v1";
 
    const requestPayload = {
      jsonrpc: '2.0',
      method: "SportsAPING/v1.0/placeOrders",
      params: {
        marketId: marketId,
        instructions: [
          { 
            selectionId: selectionId,
            handicap: "0",
            side: side,
            orderType: "LIMIT",
            limitOrder: {
              size: size,
              price: price,
              persistenceType: "PERSIST"
            }
          }
        ]
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
    res.status(200).json(response.data);
    console.log(response.data);
    
 
  } catch (error) {
    console.error('Error fetching placeOrder data:', error.message);
    if (error.response) {
      console.error('API Response Error:', error.response.data);
    }
    res.status(error.response?.status || 500).json({
      message: 'Failed to fetch placeOrder data',
      error: error.response?.data || error.message,
    });
  }
};
 
module.exports = { placeOrders };