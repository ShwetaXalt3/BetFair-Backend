const {fetchMarketBook} = require('../Controllers/marketBook')
const axios = require('axios');
const AllData = require('../services/AllData');

async function prediction(firstRunner , secondRunner , tournamentDate , sessionToken) {
  try {
      const apiUrl = "http://127.0.0.1:5001/predict";

      const requestPayload = {
          tourney_date: tournamentDate,
          player1_name: firstRunner,
          player2_name: secondRunner
      };

      const response = await axios.post(apiUrl, requestPayload, {
          headers: {
              'X-Application': process.env.API_KEY,
              'Content-Type': 'application/json',
              'X-Authentication': sessionToken,
          }
      });

      // console.log(response.data);

      return response.data;
  } catch (err) {
      console.error("Error Details:", err.response ? err.response.data : err.message);
  }
}
// prediction();

const fetchStrategy2 = async(sessionToken , marketId , amount) =>{

    try{
        console.log("I am from Strategy 2");
        const allData = AllData.getAllData();
        const matchData = allData.matchh; 
    
        if (matchData?.result && Array.isArray(matchData.result)) {
         
          const market = matchData.result.find(matchh => matchh.marketId === marketId);
        
          if (market?.runners?.length > 0) {
            var firstRunner = market.runners[0]; 
            var secondRunner = market.runners[1];

            // console.log(firstRunner.runnerName);
            // console.log(secondRunner.selectionId);
          } else {
            console.log("Error: No runners found for the given marketId.");
          }
        } else {
          console.log("Error: matchData.result is not available or not an array.");
        }
        const currentDate = new Date();  
        const tournamentDate = `${currentDate.getDate()}/${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`;
        //  console.log("Full Date and Time:", tournamentDate);

      const responseData = await prediction(firstRunner.runnerName , secondRunner.runnerName , tournamentDate , sessionToken)
      console.log(responseData);
  
   const responseLength = Object.keys(responseData).length
   const marketBookData = await fetchMarketBook(sessionToken, marketId)
   const runner1 = marketBookData.result[0].runners[0];
   const firstBackOdds = runner1.ex.availableToBack?.[0]?.price || null;
   const firstLayOdds = runner1.ex.availableToLay?.[0]?.price || null;
   const  selection_Id = firstRunner.selectionId
   
   const prob_Star = 1/(firstBackOdds + firstLayOdds);
   
      if(responseLength == 0){
        // return responseData.status(200).json({message : "Cant predict"})
        console.log("Cant predict");
        return ;
        
      }
      else{
        if(( responseData["Player1_Win_prob (0)"]["0"]) > prob_Star){
                const betData  = {
                  selection_Id,
                  marketId,
                  side : "BACK",
                  size : "0",
                  price :firstBackOdds,
                }
                const backResponse = await placeBettt(betData , sessionToken);
                console.log(backResponse);
        }
        else{
          const betData  = {
            selection_Id,
            marketId,
            side : "BACK",
            size : "0",
            price :firstBackOdds,
          }
          const backResponse = await placeBettt(betData , sessionToken);
          console.log(backResponse);
        }
        
      }
    }
    catch(err){
        console.log(err);
        
    }
    
}

async function placeBettt(strategyData , sessionToken ) {
  const { selectionId, marketId, side, size, price } = strategyData;

  const apiUrl = "https://api.betfair.com/exchange/betting/json-rpc/v1";

  const payload = {
    jsonrpc: '2.0',
    method: "SportsAPING/v1.0/placeOrders",
    params: {
      marketId,
      instructions: [
        {
          selectionId,
          handicap: "0", 
          side: side,
          orderType: "LIMIT",
          limitOrder: {
            size,
            price,
            persistenceType: "PERSIST",
          },
        },
      ],
    },
    id: 1,
  };

  try {
    const response = await axios.post(apiUrl, payload, {
      headers: {
        'X-Application': process.env.API_KEY,
        'Content-Type': 'application/json',
        'X-Authentication': sessionToken,
      },
    });

    console.log('API Response:', response.data);

    return response.data;
`    // return res.status(200).json(response.data)
`  } catch (error) {
    console.error('Error placing bet:', error.message);
    throw new Error('Error placing bet: ' + error.message);
  
};

 }

module.exports = {fetchStrategy2}