const axios = require('axios');
const { fetchStrategy3 } = require('../Controllers/ThreadWorker/strategy3');
const { fetchStrategy1 } = require('../Controllers/ThreadWorker/strategy1');
const { fetchStrategy2 } = require('../Controllers/ThreadWorker/strategy2');

const placeOrders = async (req, res) => {
  try {
    const { marketId, strategy, amount } = req.body;
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(400).json({ message: 'Missing or invalid authorization header' });
    }

    const sessionToken = authHeader.split(' ')[1];

    if (!marketId || !strategy) {
      return res.status(400).json({ message: 'Missing required parameters in request body' });
    }

    const marketIds = Array.isArray(marketId) ? marketId : [marketId]; // Ensure marketId is an array

    let fetchStrategy;

    switch (strategy) {
      case 'Strategy_3':
        fetchStrategy = fetchStrategy3;
        break;
      case 'Strategy_2':
        fetchStrategy = fetchStrategy2;
        break;
      case 'Strategy_1':
        fetchStrategy = fetchStrategy1;
        break;
      default:
        return res.status(400).json({ message: 'Invalid strategy' });
    }

    // Process all market IDs in parallel
    const strategyResults = await Promise.all(
      marketIds.map((id) => fetchStrategy(sessionToken, id, amount))
    );

    return res.status(200).json(strategyResults);

  } catch (error) {
    console.error('Error in placeOrders:', error.message);
    return res.status(500).json({
      message: 'Failed to process placeOrder',
      error: error.message,
    });
  }
};

module.exports = { placeOrders };
