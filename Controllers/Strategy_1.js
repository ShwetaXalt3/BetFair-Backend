const {fetchMarketBook} = require('../Controllers/marketBook')
const axios = require('axios');
const AllData = require('../services/AllData')

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

const fetchStrategy1 = async(sessionToken , marketId , amount) =>{
    try{
        console.log("I am from Strategy 1");
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
   console.log(marketBookData);
   
   const runner1 = marketBookData.result[0].runners[0];
   const firstBackOdds = runner1.ex.availableToBack?.[0]?.price || null;
   const firstLayOdds = runner1.ex.availableToLay?.[0]?.price || null;
   let selection_Id; 
   let prob

   if(responseData["Prediction"]["0"] === 0){
      selection_Id = firstRunner.selectionId;
       prob = responseData["Player1_Win_prob (0)"]["0"];
   }
   else{
    selection_Id = secondRunner.selectionId;
    prob  = responseData["Player2_Win_prob (1)"]["0"];
   }

    }
    catch(err){

    }
         
}

module.exports = {fetchStrategy1}