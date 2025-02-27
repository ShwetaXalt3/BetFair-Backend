 
const { fetchStrategy3 } = require('../Controllers/ThreadWorker/strategy3');
const { fetchStrategy1 } = require('../Controllers/ThreadWorker/strategy1');
const { fetchStrategy2 } = require('../Controllers/ThreadWorker/strategy2');
const AllData = require('../services/AllData')
 
const strategyMap = {
  strategy_3: fetchStrategy3,
  strategy_2: fetchStrategy2,
  strategy_1: fetchStrategy1,
};
 
const placeOrders = async (req, res) => {
  try {
    const { markets } = req.body;
    const authHeader = req.headers['authorization'];
   
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(400).json({ message: 'Missing or invalid authorization header' });
    }
 
    const sessionToken = authHeader.split(' ')[1];
 
    if (!markets || !Array.isArray(markets) || markets.length === 0) {
      return res.status(400).json({ message: 'Invalid or missing markets array' });
    }
 
    // Process each market ID with its respective strategy
    const strategyResults = await Promise.all(
      markets.map(({ marketId, strategy , amount }) => {
        AllData.setStrategy(strategy);
        AllData.setMarketId(marketId);
        AllData.setAmount(amount);
 
        const fetchStrategy = strategyMap[strategy];
        // console.log(fetchStrategy);
       
 
        if (!fetchStrategy) {
          return Promise.resolve({ marketId, error: 'Invalid strategy' });
        }
 
        return fetchStrategy(sessionToken, marketId, amount).then(result => ({
          marketId,
          strategy,
          result,
        })).catch(error => ({
          marketId,
          strategy,
          error: error.message,
        }));
      })
    );
    const strategy = [];
 
 
    strategyResults.map((i)=>{
     strategy.push(i.strategy);
    })
 
    // console.log("array ", strategy);
    AllData.setStrategy(strategy);
   
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
 
 
// const axios = require('axios');
// const { fetchStrategy3 } = require('../Controllers/Strategy_3');
// // const {fetchStrategy3} = require('../Controllers/ThreadWorker/strategy3');
// // const {fetchStrategy1} = require('../Controllers/ThreadWorker/strategy1')
// // const {fetchStrategy2} = require('../Controllers/ThreadWorker/strategy2')
// const {fetchStrategy2} = require('../Controllers/Strategy_2')
// const {fetchStrategy1} = require('../Controllers/Strategy_1')
// const AllData = require('../services/AllData')
 
// const placeOrders = async (req, res) => {
 
//   try {
//     const { marketId, strategy , amount } = req.body;
//     AllData.setStrategy(strategy);
//     const authHeader = req.headers['authorization'];
//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       return res.status(400).json({ message: 'Missing or invalid authorization header' });
//     }
 
//     const sessionToken = authHeader.split(' ')[1];
 
//     if (!marketId || !strategy) {
//       return res.status(400).json({ message: 'Missing required parameters in request body' });
//     }
 
//     // If Strategy 3 is selected, execute fetchStrategy3
//     if (strategy === 'Strategy_3') {
//       const strategyData = await fetchStrategy3(sessionToken, marketId, amount);
//       if (strategyData) {
//         AllData.placeorder(strategyData.result)
//         return res.status(200).json(strategyData)
//       }
//     }
//     else if(strategy === 'Strategy_2'){
//             const strategyData = await fetchStrategy2(sessionToken, marketId , amount)
//             if(strategyData){
//               return res.status(200).json(strategyData);
//             }
//      }
//     else if(strategy === 'Strategy_1') {
//       const strategyData = await fetchStrategy1(sessionToken , marketId , amount);
//       if(strategyData){
//         return res.status(200).json(strategyData);
//         }
//     }
//     else{
     
//       return res.status(400).json({ message: 'Invalid strategy' });
//     }
 
//   } catch (error) {
//     console.error('Error in placeOrders:', error.message);
//     return res.status(500).json({
//       message: 'Failed to process placeOrder',
//       error: error.message,
//     });
//   }
// };
 
 
 
// module.exports = { placeOrders };
 
 
 