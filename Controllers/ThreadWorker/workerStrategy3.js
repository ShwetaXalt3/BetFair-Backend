
const { parentPort } = require('worker_threads');
const axios = require('axios');
const { fetchMarketBook } = require('../marketBook');

function layStakeCalculator(backStake, layBetPrice, backBetPrice) {
    console.log("Hello ", backStake, layBetPrice);
  
    let layStake = (backStake * backBetPrice) / layBetPrice;
    layStake = Math.round(layStake * 100) / 100;
    return layStake;
  }
  


const processStrategy3 = async (sessionToken, marketId, amount, matchData) => {
    try {
        console.log(`Processing Strategy 3 for Market ID: ${marketId}`);
         console.log(matchData);
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
         
         
             const firstBackOdds = runner1.ex.availableToBack?.[0]?.price || null;
             const firstLayOdds = runner1.ex.availableToLay?.[0]?.price || null;
             const secondBackOdds = runner2.ex.availableToBack?.[0]?.price || null;
         
         
         
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
               // return res.status(400).json({ "message": "not dound last traded" })
               console.log("Not found last traded");
         
             }
             if (lastPriceTraded <= 1.1) {
               // return res.status(400).json({ "message": "Back bet price is low" })
               console.log("Back bet is low");
         
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
         
             backPrice = (amount / 2);
         
         
             // let backStake = layStakeCalculator(size, backPrice, lastPriceTraded);
             try {
               const betData = {
                 selectionId,
                 marketId,
                 side: 'BACK',
                 size: backPrice,
                 price: lastPriceTraded,
               };
               console.log("Last price Traded  back bet ", lastPriceTraded);
         
         
               // const backResponse = await placeBettt(betData, sessionToken);
         
         
               // if (backResponse.error) {
               //   console.error("BACK bet placement failed. Stopping strategy.");
               //   return;
               // }
               // else{
               //   console.log("Back Bet placed Successfully!!");
         
               // }
               // res.status(200).json(backResponse)
               // return backResponse
         
               let layBetList = [100, 100, 100, 100, 100, 100];
               let index = 5;
         
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
         
               if (true) {
                 // await processAndStoreData();
                 while (true) {
         
                   console.log("\n");
         
                   console.log("Fetching Market Book again for LAY conditions...");
         
         
                  //  if (matchData?.result && Array.isArray(matchData.result)) {
                  //    const market = matchData.result.find(matchh => matchh.marketId === marketId);
         
                  //    if (market?.runners?.length > 0) {
                  //      // Find the runner with the given selectionId   
                  //      const runner = market.runners.find(r => r.selectionId === selectionId);
         
                  //      if (runner) {
                  //        console.log("Runner Name:", runner.runnerName);
                  //      } else {
                  //        console.log("Runner not found for selectionId:", targetSelectionId);
                  //      }
                  //    } else {
                  //      console.log("No runners found for the given marketId.");
                  //    }
                  //  } else {
                  //    console.log("Error: matchData.result is not available or not an array.");
                  //  }
         
         
         
                   // ---------------------------Match Start time --------------------
         
         
         
         
                   const updatedMarketBook = await fetchMarketBook(sessionToken, marketId);
                   const updatedRunner = updatedMarketBook.result[0].runners.find(r => r.selectionId === selectionId);
         
         
                   const updatedBackPrice = updatedRunner.ex.availableToBack?.[0]?.price || null;
                   const updatedLayPrice = updatedRunner.ex.availableToLay?.[0]?.price || null;
                   // const istDate = new Date(marketTimes.getTime() + (5.5 * 60 * 60 * 1000));
                   console.log("Updated lay price : ", updatedLayPrice);
                   console.log("selection ID : ", selectionId);
                   console.log("Market Id ", marketId);
                   console.log("Market Start Time", dateInIST);
                   //  console.log("Lay odd List is " , layBetList);
                   console.log("Index is : ", index);
                   console.log("\n");
                   
         
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
                     const layStake = layStakeCalculator(backPrice, layBetList[index], lastPriceTraded)
                     const betData = {
                       selectionId,
                       marketId,
                       side: 'LAY',
                       size: backPrice,
                       price: layStake[index]
                     }
                     // const layResponse = await placeBettt(betData, sessionToken);
                     console.log("Lay bet placed on ", layStake[index]);
         
                     // console.log("LAY Bet Response: ", layResponse);
                     console.log("Lay Bet Places SuccessFully - 1");
         
         
                     break;
         
                   }
         
                   if (backBetPrice > 1.5) {
                     if (layBetList[index] < (backBetPrice - 0.1)) {
                       const layStake = layStakeCalculator(backPrice, layBetList[index], lastPriceTraded)
                       const betData = {
                         selectionId,
                         marketId,
                         side: 'LAY',
                         size: backPrice,
                         price: layStake[index]
                       }
                       // const layResponse = await placeBettt(betData, sessionToken);
         
                       // console.log("LAY Bet Response: ", layResponse);
                       console.log("Lay bet placed on ", layStake[index]);
                       console.log("Lay Bet Places SuccessFully - 2");
                       break;
                     }
                   } else {
                     if (layBetList[index] < (backBetPrice - 0.05)) {
                       const layStake = layStakeCalculator(backPrice, layBetList[index], lastPriceTraded)
                       const betData = {
                         selectionId,
                         marketId,
                         side: 'LAY',
                         size: backPrice,
                         price: layStake[index]
                       }
                       // const layResponse = await placeBettt(betData, sessionToken);
         
                       // console.log("LAY Bet Response: ", layResponse);
                       console.log("Lay bet placed on ", layStake[index]);
                       console.log("Lay Bet Places SuccessFully - 3");
                       break;
                     }
                   }
         
                   if (layBetList[index] == layPrice) {
                     const layStake = layStakeCalculator(backPrice, layBetList[index], lastPriceTraded)
                     const betData = {
                       selectionId,
                       marketId,
                       side: 'LAY',
                       size: backPrice,
                       price: layStake[index]
                     }
                     // const layResponse = await placeBettt(betData, sessionToken);
         
                     // console.log("LAY Bet Response: ", layResponse);
                     console.log("Lay bet placed on ", layStake[index]);
                     console.log("Lay Bet Places SuccessFully - 4");
                     break;
                   }
         
                   // -------------------------trigger time-----------------------
         
                   const currentTime = new Intl.DateTimeFormat('en-US', {
                     // timeZone: 'Asia/Kolkata', // Change to your desired time zone  
                     year: 'numeric',
                     month: '2-digit',
                     day: '2-digit',
                     hour: '2-digit',
                     minute: '2-digit',
                     second: '2-digit'
                   }).format(new Date());
         
                   // console.log("Time in IST:", currentTime);  
         
         
                   // if(currentTime>=triggerTime){
                   if (updatedLayPrice > (backBetPrice + 0.3)) {
                     const layStake = layStakeCalculator(backPrice, updatedLayPrice, lastPriceTraded)
                     const betData = {
                       selectionId,
                       marketId,
                       side: 'LAY',
                       size: backPrice,
                       price: updatedLayPrice
                     }
                     // const layResponse = await placeBettt(betData, sessionToken);
         
                     // console.log("LAY Bet Response: ", layResponse);
                     console.log("Lay bet placed on ", updatedLayPrice);
                     console.log("Lay Bet Places SuccessFully - 5");
                     console.log("Triggered Time", triggerTime)
                     break;
                   }
                   // }
         
                   // Wait for 30 seconds before checking again
                   await new Promise(resolve => setTimeout(resolve, 5000));
                 }
               }


        
        parentPort.postMessage({ success: true, marketId });

    } catch (err) {
        console.error("Worker Error:", err);
        parentPort.postMessage({ success: false, error: err.message });
    }
}catch(err){
    console.log(err);
    
}
}

async function placeBet(strategyData, sessionToken) {
    const { selection_Id, marketId, side, size, price } = strategyData;
    const apiUrl = "https://api.betfair.com/exchange/betting/json-rpc/v1";

    const payload = {
        jsonrpc: '2.0',
        method: "SportsAPING/v1.0/placeOrders",
        params: {
            marketId,
            instructions: [{
                selectionId: selection_Id,
                handicap: 0,
                side: side,
                orderType: "LIMIT",
                limitOrder: {
                    size: parseFloat(size),
                    price: parseFloat(price),
                    persistenceType: "PERSIST",
                },
            }],
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

        return response.data;
    } catch (error) {
        console.error('Error placing bet:', error.message);
        return null;
    }
}


parentPort.on("message", async (data) => {
    await processStrategy3(data.sessionToken, data.marketId, data.amount, data.matchData);
}); 