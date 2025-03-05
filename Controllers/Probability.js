const axios = require('axios');
const AllData = require('../services/AllData');

const fetchProbability = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(400).json({ message: 'Missing or invalid authorization header' });
    }
   
    const sessionToken = authHeader.split(' ')[1];

    const { amount, strategies } = req.body;
    // console.log(amount, strategies);
    const allData = AllData.getAllData();
    const matchData = allData.matchh.result;
    // console.log(matchData);
    

    if (!matchData || !Array.isArray(matchData)) {
      return res.status(400).json({ message: 'Invalid or missing matchData array' });
    }

    const apiUrl = "http://127.0.0.1:5001/fetch_particular_match";

    var id = ""
    const requestPayload = {
      data: {
        market_catalogue: matchData.map(market => {
          // console.log("Market Data:", market); 
    
       
          if (!Array.isArray(market.runners)) {
            console.error(`Market ${market.marketId} has invalid runners structure`);
            return {};  
          }
    
          return {
            amount: amount,  
            strategy: strategies,  
            competition: {
              id: market.competition?.id || "",  
              name: market.competition?.name || "",  
            },
            marketId: market.marketId,
            marketName: market.marketName,
            marketStartTime: market.marketStartTime || "",  
            totalMatched: market.totalMatched || 0, 
            runners: market.runners.map((runner, index) => {
              // console.log(`Runner at index ${index}:`, runner); // Log each runner
    
              
              const runnerName = runner?.runnerName;
    
              if (!runnerName) {
                console.warn(`Runner at index ${index} has no runnerName!`);
              }
    
              return {
                runnerName: runnerName || "Unknown Runner",  
                selectionId: runner?.selectionId || "",  
                handicap: runner?.handicap || 0, 
                sortPriority: runner?.sortPriority || 0,  
                metadata: {
                  runnerId: String(runner?.selectionId || ""),  
                }
              };
            }),
          };
        }),
      }
    };
    
  
    
    

    const response = await axios.post(apiUrl, requestPayload, {
      headers: {
        'X-Application': process.env.API_KEY,    
        'Content-Type': 'application/json',    
        'X-Authentication': sessionToken,      
      }
    });
    const data = response.data;


// data.winning_player_data = data.winning_player_data.filter(player => player.player_win_prob !== "");

// if (data.winning_player_data.length === 0) {
//     console.log("No valid data found with probability.");
//     return res.status(400).json({ message: "No valid probability data available" });
// }
AllData.probability(data);
res.status(200).json(data);

  } catch (error) {
    console.error('Fetch Probability Error:', error.message);
    if (error.response) {
      console.error('API Response Error:', error.response.data);
      console.error('Status Code:', error.response.status);
    }

    res.status(500).json({
      error: 'Failed to fetch probability data',
      message: error.message,
    });
  }
};

module.exports = { fetchProbability };