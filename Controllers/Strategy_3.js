const { fetchMarketBook } = require('../Controllers/marketBook');
const axios = require('axios')
// const {fetchMatch} = require('../Controllers/matchController')
const AllData = require('../services/AllData')


function layStakeCalculator(backStake, layBetPrice, backBetPrice) {

  console.log("Hello " , backStake , layBetPrice );
  
  let layStake = (backStake * backBetPrice) / layBetPrice;
  layStake = Math.round(layStake * 100) / 100; 
  return layStake;
}

const fetchStrategy3 = async (sessionToken, marketId , amount) => {
  try {
    const allData = AllData.getAllData();
const matchData = allData.matchh; 

if (matchData && matchData.result && Array.isArray(matchData.result)) {
  var marketTimes = matchData.result
    .filter(matchh => matchh.marketId === marketId)  
    .map(matchh => matchh.marketStartTime);  
} else {
  console.log("Error: matchData.result is not available or not an array");
}
      

    const marketBookData = await fetchMarketBook(sessionToken, marketId);
    // console.log(marketBookData);
    
    if (!marketBookData || !marketBookData.result || marketBookData.result.length === 0) {
      throw new Error("Invalid market book data");
    }
    // console.log(marketBookData.result[0].runners[0].ex);
    


    // Extract odds for both runners
    const runner1 = marketBookData.result[0].runners[0];
    const runner2 = marketBookData.result[0].runners[1];

    const firstBackOdds = runner1.ex.availableToBack?.[0]?.price || null;
    const firstLayOdds = runner1.ex.availableToLay?.[0]?.price || null;
    const secondBackOdds = runner2.ex.availableToBack?.[0]?.price || null;
    // const secondLayOdds = runner2.ex.availableToLay?.[0]?.price || null;

   

    if (!firstBackOdds || !secondBackOdds) {
      throw new Error("Back odds not found");
    }

    let lastPriceTraded, selectionId, backPrice, layPrice;

    // Determine the selection for BACK bet
    if (firstBackOdds > secondBackOdds) {
      lastPriceTraded = secondBackOdds;
      selectionId = runner2.selectionId;
      // backPrice = secondBackOdds;
      // layPrice = secondLayOdds;
    } else {
      lastPriceTraded = firstBackOdds;
      selectionId = runner1.selectionId;
      // backPrice = firstBackOdds;
      // layPrice = firstLayOdds;
    }
    if (!lastPriceTraded) {
      return res.status(400).json({ "message": "not dound last traded" })
    }
    if (lastPriceTraded <= 1.1) {
      return res.status(400).json({ "message": "Back bet price is low" })
    }
    if(lastPriceTraded<=1.2){
      layPrice = (lastPriceTraded-0.5)
    }
    else if(lastPriceTraded>1.2){
       layPrice = (lastPriceTraded-0.1)
    }

    if(layPrice<1.05){
      layPrice = 1.05
    }

    backPrice = (amount/2);
   
   
    // let backStake = layStakeCalculator(size, backPrice, lastPriceTraded);
    try {
      const betData = {
        selectionId,
        marketId,
        side: 'BACK',
        size: "0",  
        price: lastPriceTraded, 
      };
    
      
      const backResponse = await placeBettt(betData, sessionToken);
  
      
      if (backResponse.error) {
        console.error("BACK bet placement failed. Stopping strategy.");
        return;
      }
      // res.status(200).json(backResponse)
      // return backResponse
      
      let layBetList = [100,100,100,100,100,100];
      let index = 5;
      
      //--------------- Start while loop for LAY condition checking---------------------|||||||||||||

  if(backResponse.result.status === 'SUCESS'){
        while (true) {
          console.log("Fetching Market Book again for LAY conditions...");



          const updatedMarketBook = await fetchMarketBook(sessionToken, marketId);
          const updatedRunner = updatedMarketBook.result[0].runners.find(r => r.selectionId === selectionId);
         
          
          const updatedBackPrice = updatedRunner.ex.availableToBack?.[0]?.price || null;
          const updatedLayPrice = updatedRunner.ex.availableToLay?.[0]?.price || null;
           console.log(updatedLayPrice);
           
          const  backBetPrice = lastPriceTraded;

          if(marketBookData.status === 'CLOSED'){
            return res.status(200).json({message : "betting closed"})
            // break;
          }
          if(updatedLayPrice < (backBetPrice-0.01)  && layBetList[index] !== updatedLayPrice ){
            layBetList.push(updatedLayPrice);
            index = index+1;
          }

          if(layBetList[index-5]< layBetList[index]){
            const layStake  = layStakeCalculator(backBetPrice  , layBetList[index], lastPriceTraded)
            const betData = {
              selectionId,
              marketId,
              side: 'LAY',
              size: "0",  
              price: layStake[index] 
            }
            const layResponse = await placeBettt(betData, sessionToken);
      
            console.log("LAY Bet Response: ", layResponse);
            break;

          }

          if(backBetPrice > 1.5){
            if(layBetList[index]<backBetPrice - 0.1){
              const layStake  = layStakeCalculator(backBetPrice  , layBetList[index], lastPriceTraded)
            const betData = {
              selectionId,
              marketId,
              side: 'LAY',
              size: "0",  
              price: layStake[index] 
            }
            const layResponse = await placeBettt(betData, sessionToken);
      
            console.log("LAY Bet Response: ", layResponse);
            break;
            }
          }else{
            if(layBetList[index]<backBetPrice - 0.05){
              const layStake  = layStakeCalculator(backBetPrice  , layBetList[index], lastPriceTraded)
            const betData = {
              selectionId,
              marketId,
              side: 'LAY',
              size: "0",  
              price: layStake[index] 
            }
            const layResponse = await placeBettt(betData, sessionToken);
      
            console.log("LAY Bet Response: ", layResponse);
            break;
            }
          }

          if(layBetList[index] == layPrice){
            const layStake  = layStakeCalculator(backBetPrice  , layBetList[index], lastPriceTraded)
            const betData = {
              selectionId,
              marketId,
              side: 'LAY',
              size: "0",  
              price: layStake[index] 
            }
            const layResponse = await placeBettt(betData, sessionToken);
      
            console.log("LAY Bet Response: ", layResponse);
            break;
          }
    
            // -------------------------trigger time-----------------------
          const currentTime = new Date();
          const matchStartTime = marketTimes; // Replace with actual match start time
          const triggerTime = new Date(matchStartTime.getTime() + 30 * 60000);

          if(currentTime>=triggerTime){
            if(updatedLayPrice> backBetPrice + 0.3){
              const layStake  = layStakeCalculator(backBetPrice  , layBetList[index], lastPriceTraded)
            const betData = {
              selectionId,
              marketId,
              side: 'LAY',
              size: "0",  
              price: layStake[index] 
            }
            const layResponse = await placeBettt(betData, sessionToken);
      
            console.log("LAY Bet Response: ", layResponse);
            break;
            }
          }
    
          // Wait for 30 seconds before checking again
          await new Promise(resolve => setTimeout(resolve, 30000));
        }
      }
    
    
    } catch (error) {
      console.error('Error placing BACK bet:', error.message);
    }


  } catch (error) {
    console.error("Error in Strategy 3: ", error.message);
  }
};





async function placeBettt(strategyData , sessionToken ) {
  const { selectionId, marketId, side, size, price } = strategyData;
  
  // console.log("tgtfgtfg", strategyData);

  // console.log('Placing Bet with strategy data:', strategyData);
  // console.log(matchData);

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

module.exports = { fetchStrategy3 };
