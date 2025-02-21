
const { parentPort } = require('worker_threads');
const axios = require('axios');
const { fetchMarketBook } = require('../marketBook');
const { processAndStoreData } = require('../../services/dataService');
const AllData = require('../../services/AllData')

function layStakeCalculator(backStake, layBetPrice, backBetPrice) {
  console.log("Hello ", backStake, layBetPrice);

  let layStake = (backStake * backBetPrice) / layBetPrice;
  layStake = Math.round(layStake * 100) / 100;
  return layStake;
}



const processStrategy3 = async (sessionToken, marketId, amount, matchData) => {
  try {
    console.log(`Processing Strategy 3 for Market ID: ${marketId}`);
    //  console.log(matchData);
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
    //  const firstLayOdds = runner1.ex.availableToLay?.[0]?.price || null;
    const secondBackOdds = runner2.ex.availableToBack?.[0]?.price || null;



    if (!firstBackOdds || !secondBackOdds) {
      const reason = "Back odds not found";
      parentPort.postMessage({ success: false, reason });
      return;
      // throw new Error("Back odds not found");
    }

    let lastPriceTraded, selectionId, backStake, layPrice;

    // Determine the selection for BACK bet
    if (firstBackOdds > secondBackOdds) {
      lastPriceTraded = secondBackOdds;
      selectionId = runner2.selectionId;
      // backStake = secondBackOdds;
      // layPrice = secondLayOdds;
    } else {
      lastPriceTraded = firstBackOdds;
      selectionId = runner1.selectionId;
      // backStake = firstBackOdds;
      // layPrice = firstLayOdds;
    }
    if (!lastPriceTraded) {
      // return res.status(400).json({ "message": "not dound last traded" })
      console.log("Not found last traded");
      const val = "Not found last traded"
      parentPort.postMessage({ success: false, val })
      return;

    }
    if (lastPriceTraded <= 1.1) {
      // return res.status(400).json({ "message": "Back bet price is low" })
      console.log("Back bet is low");
      const val = "Back bet is low"
      parentPort.postMessage({ success: false, val })
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

    // let backStake = layStakeCalculator(size, backStake, lastPriceTraded);

    // -------------------back bet try catch---------------

    try {
      const betData = {
        selectionId,
        marketId,
        side: 'BACK',
        size: backStake,
        price: lastPriceTraded,
      };
      console.log("Last price Traded  back bet ", lastPriceTraded);


      //  backResponse = await placeBettt(betData, sessionToken);
      backResponse = {
        "jsonrpc": "2.0",
        "result": {
          "marketId": "1.111836557",
          "instructionReports": [
            {
              "instruction": {
                "selectionId": 5404312,
                "handicap": 0,
                "marketOnCloseOrder": {
                  "liability": 2
                },
                "orderType": "MARKET_ON_CLOSE",
                "side": "BACK"
              },
              "betId": "31645233727",
              "placedDate": "2013-11-12T12:07:29.000Z",
              "status": "SUCCESS"
            }
          ],
          "status": "SUCCESS"
        },
        "id": 1
      }

      var statuss = backResponse.result.status;
      // var statuss = "SUCCESS"

      if (backResponse.error) {
        console.error("BACK bet placement failed. Stopping strategy.");
        return;
      }
      else {
        console.log("Back Bet placed Successfully!!");
        parentPort.postMessage({ success: true, backResponse });

      }

    } catch (err) {
      console.error("Error placing back bet", err);
      parentPort.postMessage({ success: false, error: err.message });
    }

    // ------------------------------Lay bet try catch---------------
    try {


      let layBetList = [100, 100, 100, 100, 100, 100];
      let index = 5;
      var layResponse = null;


      let triggerTime = null;

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




      //-----------------------------------Lay condition-----------------
      try {
        if (statuss === "SUCCESS") {
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


            const updatedLayPrice = updatedRunner.ex.availableToLay?.[0]?.price || NaN;
            if (updatedLayPrice === null) {
              continue;
            }
            // const istDate = new Date(marketTimes.getTime() + (5.5 * 60 * 60 * 1000));
            console.log("Updated lay price : ", updatedLayPrice);
            console.log("selection ID : ", selectionId);
            console.log("Market Id ", marketId);
            //  console.log("Market Start Time", dateInIST);
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
            console.log("\n");


            if (layBetList[index - 5] < layBetList[index]) {
              const layStake = layStakeCalculator(backStake, layBetList[index], lastPriceTraded)
              const betData = {
                selectionId,
                marketId,
                side: 'LAY',
                size: layStake,
                price: layBetList[index]
              }
              //  layResponse = await placeBettt(betData, sessionToken);
              // layResponse = "Hi i am lay response from strategy-3"
              layResponse = {
                "jsonrpc": "2.0",
                "result": {
                  "marketId": "1.109850906",
                  "instructionReports": [
                    {
                      "instruction": {
                        "selectionId": 237486,
                        "handicap": 0,
                        "limitOrder": {
                          "size": 2,
                          "price": 3,
                          "persistenceType": "LAPSE"
                        },
                        "orderType": "LIMIT",
                        "side": "LAY"
                      },
                      "betId": "31242604945",
                      "placedDate": "2013-10-30T14:22:47.000Z",
                      "averagePriceMatched": 0,
                      "sizeMatched": 0,
                      "status": "SUCCESS"
                    }
                  ],
                  "status": "SUCCESS"
                },
                "id": 1
              }
              parentPort.postMessage({ success: true, layResponse });
              console.log("Lay bet placed on ", layBetList[index]);

              // console.log("LAY Bet Response: ", layResponse);
              console.log("Lay Bet Places SuccessFully - 1");
              // AllData.layplaceorder(layResponse)

              try {
                const response = await axios.post('http://localhost:6060/api/history');
                console.log('API Response:', response.data);
              } catch (error) {
                console.error('Error hitting API:', error.message);
              }


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
                layResponse = {
                  "jsonrpc": "2.0",
                  "result": {
                    "marketId": "1.109850906",
                    "instructionReports": [
                      {
                        "instruction": {
                          "selectionId": 237486,
                          "handicap": 0,
                          "limitOrder": {
                            "size": 2,
                            "price": 3,
                            "persistenceType": "LAPSE"
                          },
                          "orderType": "LIMIT",
                          "side": "LAY"
                        },
                        "betId": "31242604945",
                        "placedDate": "2013-10-30T14:22:47.000Z",
                        "averagePriceMatched": 0,
                        "sizeMatched": 0,
                        "status": "SUCCESS"
                      }
                    ],
                    "status": "SUCCESS"
                  },
                  "id": 1
                }
                parentPort.postMessage({ success: true, layResponse });

                // console.log("LAY Bet Response: ", layResponse);
                console.log("Lay bet placed on ", layBetList[index]);
                console.log("Lay Bet Places SuccessFully - 2");
                // AllData.layplaceorder(layResponse)

                try {
                  const response = await axios.post('http://localhost:6060/api/history');
                  console.log('API Response:', response.data);
                } catch (error) {
                  console.error('Error hitting API:', error.message);
                }

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
                layResponse = {
                  "jsonrpc": "2.0",
                  "result": {
                    "marketId": "1.109850906",
                    "instructionReports": [
                      {
                        "instruction": {
                          "selectionId": 237486,
                          "handicap": 0,
                          "limitOrder": {
                            "size": 2,
                            "price": 3,
                            "persistenceType": "LAPSE"
                          },
                          "orderType": "LIMIT",
                          "side": "LAY"
                        },
                        "betId": "31242604945",
                        "placedDate": "2013-10-30T14:22:47.000Z",
                        "averagePriceMatched": 0,
                        "sizeMatched": 0,
                        "status": "SUCCESS"
                      }
                    ],
                    "status": "SUCCESS"
                  },
                  "id": 1
                }
                parentPort.postMessage({ success: true, layResponse });

                // console.log("LAY Bet Response: ", layResponse);
                console.log("Lay bet placed on ", layBetList[index]);
                console.log("Lay Bet Places SuccessFully - 3");
                // AllData.layplaceorder(layResponse)

                try {
                  const response = await axios.post('http://localhost:6060/api/history');
                  console.log('API Response:', response.data);
                } catch (error) {
                  console.error('Error hitting API:', error.message);
                }

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
              //  layResponse = await placeBettt(betData, sessionToken);
              layResponse = {
                "jsonrpc": "2.0",
                "result": {
                  "marketId": "1.109850906",
                  "instructionReports": [
                    {
                      "instruction": {
                        "selectionId": 237486,
                        "handicap": 0,
                        "limitOrder": {
                          "size": 2,
                          "price": 3,
                          "persistenceType": "LAPSE"
                        },
                        "orderType": "LIMIT",
                        "side": "LAY"
                      },
                      "betId": "31242604945",
                      "placedDate": "2013-10-30T14:22:47.000Z",
                      "averagePriceMatched": 0,
                      "sizeMatched": 0,
                      "status": "SUCCESS"
                    }
                  ],
                  "status": "SUCCESS"
                },
                "id": 1
              }
              parentPort.postMessage({ success: true, layResponse });

              // console.log("LAY Bet Response: ", layResponse);
              console.log("Lay bet placed on ", layStake[index]);
              console.log("Lay Bet Places SuccessFully - 4");
              // AllData.layplaceorder(layResponse)

              try {
                const response = await axios.post('http://localhost:6060/api/history');
                console.log('API Response:', response.data);
              } catch (error) {
                console.error('Error hitting API:', error.message);
              }

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
              layResponse = {
                "jsonrpc": "2.0",
                "result": {
                  "marketId": "1.109850906",
                  "instructionReports": [
                    {
                      "instruction": {
                        "selectionId": 237486,
                        "handicap": 0,
                        "limitOrder": {
                          "size": 2,
                          "price": 3,
                          "persistenceType": "LAPSE"
                        },
                        "orderType": "LIMIT",
                        "side": "LAY"
                      },
                      "betId": "31242604945",
                      "placedDate": "2013-10-30T14:22:47.000Z",
                      "averagePriceMatched": 0,
                      "sizeMatched": 0,
                      "status": "SUCCESS"
                    }
                  ],
                  "status": "SUCCESS"
                },
                "id": 1
              }
              parentPort.postMessage({ success: true, layResponse });

              // console.log("LAY Bet Response: ", layResponse);
              console.log("Lay bet placed on ", updatedLayPrice);
              console.log("Lay Bet Places SuccessFully - 5");
              // AllData.layplaceorder(layResponse)

              try {
                const response = await axios.post('http://localhost:6060/api/history');
                console.log('API Response:', response.data);
              } catch (error) {
                console.error('Error hitting API:', error.message);
              }

              //  console.log("Triggered Time", triggerTime)
              break;
            }
            // }


            await new Promise(resolve => setTimeout(resolve, 30000));
          }
          parentPort.postMessage({ success: true, backResponse, layResponse });
        }


      } catch (err) {
        console.log(err);

      }


    } catch (err) {
      console.log("Error placing lay bet", err);
      parentPort.postMessage({ success: false, error: err.message });
    }

  } catch (err) {
    console.log("error in whole code", err);

  }
}

async function placeBettt(strategyData, sessionToken) {
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
