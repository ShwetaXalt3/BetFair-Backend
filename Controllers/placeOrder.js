const axios = require('axios');
const { fetchStrategy3 } = require('../Controllers/Strategy_3');
const {fetchStrategy2} = require('../Controllers/Strategy_2')
const {fetchStrategy1} = require('../Controllers/Strategy_1')

const placeOrders = async (req, res) => {

  try {
    const { marketId, strategy , amount } = req.body;
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(400).json({ message: 'Missing or invalid authorization header' });
    }

    const sessionToken = authHeader.split(' ')[1];

    if (!marketId || !strategy) {
      return res.status(400).json({ message: 'Missing required parameters in request body' });
    }

    // If Strategy 3 is selected, execute fetchStrategy3
    if (strategy === 'Strategy_3') {
      const strategyData = await fetchStrategy3(sessionToken, marketId, amount);
      if (strategyData) {
        return res.status(200).json(strategyData)
      }
    } 
    else if(strategy === 'Strategy_2'){
            const strategyData = await fetchStrategy2(sessionToken, marketId , amount)
            if(strategyData){
              return res.status(200).json(strategyData);
            }
     }
    else if(strategy === 'Strategy_1') {
      const strategyData = await fetchStrategy1(sessionToken , marketId , amount);
      if(strategyData){
        return res.status(200).json(strategyData);
        }
    }
    else{
      
      return res.status(400).json({ message: 'Invalid strategy' });
    }

  } catch (error) {
    console.error('Error in placeOrders:', error.message);
    return res.status(500).json({
      message: 'Failed to process placeOrder',
      error: error.message,
    });
  }
};



module.exports = { placeOrders };