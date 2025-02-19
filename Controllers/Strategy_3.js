const { fetchMarketBook } = require('../Controllers/marketBook');
const axios = require('axios')
// const {fetchMatch} = require('../Controllers/matchController')
const AllData = require('../services/AllData')


function layStakeCalculator(backStake, layBetPrice, backBetPrice) {
  console.log("Hello ", backStake, layBetPrice);

  let layStake = (backStake * backBetPrice) / layBetPrice;
  layStake = Math.round(layStake * 100) / 100;
  return layStake;
}

const fetchStrategy3 = async (sessionToken, marketId, amount) => {
  try {
    console.log("from 3");

    const allData = AllData.getAllData();
    const matchData = allData.matchh;
    // console.log(matchData);

    var marketTimes;
    if (matchData && matchData.result && Array.isArray(matchData.result)) {
      marketTimes = matchData.result
        .filter(matchh => matchh.marketId === marketId)
        .map(matchh => {
          // console.log(matchh.marketStartTime); 
          return matchh.marketStartTime;
        });
    } else {
      console.log("Error: matchData.result is not available or not an array");
    }



    const dateInUTC = new Date(marketTimes);
    const dateInIST = dateInUTC.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const marketBookData = await fetchMarketBook(sessionToken, marketId);
    // console.log(marketBookData);


    if (!marketBookData || !marketBookData.result || marketBookData.result.length === 0) {
      throw new Error("Invalid market book data");
    }



    const runner1 = marketBookData.result[0].runners[0];
    const runner2 = marketBookData.result[0].runners[1];
    // console.log(runner1 , runner2);


    const firstBackOdds = runner1.ex.availableToBack?.[0]?.price || NaN;
    // const firstLayOdds = runner1.ex.availableToLay?.[0]?.price || null;
    const secondBackOdds = runner2.ex.availableToBack?.[0]?.price || NaN;



    if (!firstBackOdds || !secondBackOdds) {
      throw new Error("Back odds not found");
    }

    let lastPriceTraded, selectionId, backStake, layPrice;

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
      // return res.status(400).json({ "message": "not dound last traded" })
      console.log("Not found last traded");
      return;

    }
    if (lastPriceTraded <= 1.1) {
      // return res.status(400).json({ "message": "Back bet price is low" })
      console.log("Back bet is low");
      return;

    }
    if (lastPriceTraded <= 1.2) {
      layPrice = (lastPriceTraded - 0.5)
    }
    else if (lastPriceTraded > 1.2) {
      layPrice = (lastPriceTraded - 0.1)
    }

    if (layPrice < 1.05) {
      layPrice = 1.05
    }

    backStake = (amount / 2);
    var backResponse;


    // let backStake = layStakeCalculator(size, backPrice, lastPriceTraded);

    // Back bet try block
    try {
      const betData = {
        selectionId,
        marketId,
        side: 'BACK',
        size: backStake,
        price: lastPriceTraded,
      };
      console.log("Last price Traded  back bet ", lastPriceTraded);


      // backResponse = await placeBettt(betData, sessionToken);
      // var statuss = backResponse.result.status;
      var statuss = "SUCESS"


      // if (backResponse.error) {
      //   console.error("BACK bet placement failed. Stopping strategy.");
      //   return;
      // }
      // else{

      // }
      //   console.log("Back Bet placed Successfully!!");

    } catch (error) {
      console.error('Error placing BACK bet:', error.message);
    }


      //------------------------Lay try block--------------------------
      try{

     
      let layBetList = [100, 100, 100, 100, 100, 100];
      let index = 5;
      let layResponse = null;

      //--------------- Start while loop for LAY condition checking---------------------|||||||||||||
      let triggerTime = null; // Declare globally

      const initializeTriggerTime = (marketTimes) => {
        if (!triggerTime && marketTimes.length > 0) {
          const matchStartTime = new Date(marketTimes[0]);
          // console.log(matchStartTime);


          if (!isNaN(matchStartTime.getTime())) {
            triggerTime = new Date(matchStartTime.getTime() + 30 * 60000);
            // console.log("Trigger Time Set:", triggerTime);
          }
        }
      };


      initializeTriggerTime(marketTimes);



      // backResponse.result.status = 'SUCESS'

      // if(backResponse.result.status === 'SUCESS'){

      if (statuss === "SUCESS") {
        // await processAndStoreData();
        while (true) {

          console.log("\n");

          console.log("Fetching Market Book again for LAY conditions...");


          if (matchData?.result && Array.isArray(matchData.result)) {
            const market = matchData.result.find(matchh => matchh.marketId === marketId);

            if (market?.runners?.length > 0) {
              // Find the runner with the given selectionId   
              const runner = market.runners.find(r => r.selectionId === selectionId);

              if (runner) {
                console.log("Runner Name:", runner.runnerName);
              } else {
                console.log("Runner not found for selectionId:", targetSelectionId);
              }
            } else {
              console.log("No runners found for the given marketId.");
            }
          } else {
            console.log("Error: matchData.result is not available or not an array.");
          }



          // ---------------------------Match Start time --------------------

          const updatedMarketBook = await fetchMarketBook(sessionToken, marketId);
          const updatedRunner = updatedMarketBook.result[0].runners.find(r => r.selectionId === selectionId);


          const updatedLayPrice = updatedRunner.ex.availableToLay?.[0]?.price || NaN;
          if(updatedLayPrice  === NaN){
            // console.log("No Lay Price available for the selectionId:", selectionId);
            continue;
          }
          // const istDate = new Date(marketTimes.getTime() + (5.5 * 60 * 60 * 1000));
          console.log("Updated lay price : ", updatedLayPrice);
          console.log("selection ID : ", selectionId);
          console.log("Market Id ", marketId);
          console.log("Market Start Time", dateInIST);
          //  console.log("Lay odd List is " , layBetList);
          console.log("Index is : ", index);

          //  console.log("Trigger Time is : " , triggerTime);


          const backBetPrice = lastPriceTraded;

          if (marketBookData.status === 'CLOSED') {
            return res.status(200).json({ message: "betting closed" })
            // break;
          }
          if (updatedLayPrice < (backBetPrice - 0.01) && layBetList[index] !== updatedLayPrice) {
            layBetList.push(updatedLayPrice);
            index = index + 1;
          }
          console.log("Lay odd List is ", layBetList);

          if (layBetList[index - 5] < layBetList[index]) {
            const layStake = layStakeCalculator(backStake, layBetList[index], lastPriceTraded)
            const betData = {
              selectionId,
              marketId,
              side: 'LAY',
              size: layStake,
              price: layBetList[index]
            }
            // layResponse = await placeBettt(betData, sessionToken);
            console.log("Lay bet placed on ", layBetList[index]);

            // console.log("LAY Bet Response: ", layResponse);
            console.log("Lay Bet Places SuccessFully - 1");


            break;

          }

          if (backBetPrice > 1.5) {
            if (layBetList[index] < (backBetPrice - 0.1)) {
              const layStake = layStakeCalculator(backStake, layBetList[index], lastPriceTraded)
              const betData = {
                selectionId,
                marketId,
                side: 'LAY',
                size: layStake,
                price: layBetList[index]
              }
              //  layResponse = await placeBettt(betData, sessionToken);

              // console.log("LAY Bet Response: ", layResponse);
              console.log("Lay bet placed on ", layBetList[index]);
              console.log("Lay Bet Places SuccessFully - 2");
              break;
            }
          } else {
            if (layBetList[index] < (backBetPrice - 0.05)) {
              const layStake = layStakeCalculator(backStake, layBetList[index], lastPriceTraded)
              const betData = {
                selectionId,
                marketId,
                side: 'LAY',
                size: layStake,
                price: layBetList[index]
              }
              //  layResponse = await placeBettt(betData, sessionToken);

              // console.log("LAY Bet Response: ", layResponse);
              console.log("Lay bet placed on ", layBetList[index]);
              console.log("Lay Bet Places SuccessFully - 3");
              break;
            }
          }

          if (layBetList[index] == layPrice) {
            const layStake = layStakeCalculator(backStake, layBetList[index], lastPriceTraded)
            const betData = {
              selectionId,
              marketId,
              side: 'LAY',
              size: layStake,
              price: layBetList[index]
            }
            // layResponse = await placeBettt(betData, sessionToken);

            // console.log("LAY Bet Response: ", layResponse);
            console.log("Lay bet placed on ", layStake[index]);
            console.log("Lay Bet Places SuccessFully - 4");
            break;
          }

          // -------------------------trigger time-----------------------

          // const currentTime = new Intl.DateTimeFormat('en-US', {
          //   // timeZone: 'Asia/Kolkata', // Change to your desired time zone  
          //   year: 'numeric',
          //   month: '2-digit',
          //   day: '2-digit',
          //   hour: '2-digit',
          //   minute: '2-digit',
          //   second: '2-digit'
          // }).format(new Date());

          // console.log("Time in IST:", currentTime);  


          // if(currentTime>=triggerTime){
          if (updatedLayPrice > (backBetPrice + 0.3)) {
            const layStake = layStakeCalculator(backStake, updatedLayPrice, lastPriceTraded)
            const betData = {
              selectionId,
              marketId,
              side: 'LAY',
              size: layStake,
              price: updatedLayPrice
            }
            //  layResponse = await placeBettt(betData, sessionToken);

            // console.log("LAY Bet Response: ", layResponse);
            console.log("Lay bet placed on ", updatedLayPrice);
            console.log("Lay Bet Places SuccessFully - 5");
            break;
          }
          // }

          // Wait for 30 seconds before checking again
          await new Promise(resolve => setTimeout(resolve, 30000));
        }
      }
    }catch(err){
      console.log("error in lay bet " , err);
      
    }

      return { backResponse, layResponse };
   
  } catch (error) {
    console.error("Error in Strategy 3: ", error.message);
  }
};

async function placeBettt(strategyData, sessionToken) {
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
