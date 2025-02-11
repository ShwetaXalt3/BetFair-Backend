const axios = require('axios');
const AllData = require('../services/AllData')
const {fetchMarketBook} = require('../Controllers/marketBook')

const placeOrders = async (req, res) => {
  try {
  
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(400).json({ message: 'Missing or invalid authorization header' });
    }

    const sessionToken = authHeader.split(' ')[1];

    
    const { selectionId, marketId, side, size, price , strategy , playerBackOdd , playerLayOdd , playerName , Prob } = req.body;

   
    if (!selectionId || !marketId || !side || !size || !price) {
      return res.status(400).json({ message: 'Missing required parameters in request body' });
    }

    // console.log('Parameters:', selectionId, marketId, side, size, price);

    if (strategy === 'Strategy_3') {
      console.log('Executing Strategy 3: Fetching Market Book...');
      const marketBookData = await fetchMarketBook(sessionToken, marketId);

      
    // const FirstmarketBackOdds = marketData.result[0].runners[0].ex.availableToBack[0].price;
    // console.log(FirstmarketBackOdds);

    // const FirstmarketLayOdds = marketData.result[0].runners[0].ex.availableToLay[0].price;
    // console.log(FirstmarketLayOdds);
    
    // const SecondmarketBackOdds = marketData.result[0].runners[1].ex.availableToBack[0].price;
    // console.log(SecondmarketBackOdds);

    // const SecondmarketLayOdds = marketData.result[0].runners[1].ex.availableToLay[0].price;
    // console.log(SecondmarketLayOdds);

      
     
    }

    const apiUrl = process.env.API_BASE_URL || "https://api.betfair.com/exchange/betting/json-rpc/v1";

 
    const createPayload = (side) => ({
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
    });

    const payload = createPayload(side);

    const response = await axios.post(apiUrl, payload, {
      headers: {
        'X-Application': process.env.API_KEY,    
        'Content-Type': 'application/json',    
        'X-Authentication': sessionToken,      
      }
    });

    // Send the response back to the client
    res.status(200).json(response.data);
    console.log('API Response:', response.data);

  } catch (error) {
    console.error('Error fetching placeOrder data:', error.message);

    // Streamlined error handling
    const statusCode = error.response ? error.response.status : 500;
    const errorMessage = error.response ? error.response.data : error.message;

    console.error('API Response Error:', errorMessage);
    
    res.status(statusCode).json({
      message: 'Failed to fetch placeOrder data',
      error: errorMessage,
    });
  }
};

module.exports = { placeOrders };
