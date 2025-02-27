const { parentPort } = require('worker_threads');
const axios = require('axios');
const { fetchMarketBook } = require('../marketBook'); // Adjust the path as necessary
const tls = require('tls');

async function prediction(firstRunner, secondRunner, tournamentDate, sessionToken) {
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
        return response.data;
    } catch (err) {
        console.error("Prediction API Error:", err.message);
        return null;
    }
}

const processStrategy1 = async (sessionToken, marketId, amount, matchData) => {
    console.log(`Processing Strategy 1 for Market ID: ${marketId}`);

    if (matchData?.result && Array.isArray(matchData.result)) {
        const market = matchData.result.find(matchh => matchh.marketId === marketId);

        if (market?.runners?.length > 0) {
            var firstRunner = market.runners[0];
            var secondRunner = market.runners[1];
        } else {
            console.log("Error: No runners found for the given marketId.");
            return;
        }
    } else {
        console.log("Error: matchData.result is not available or not an array.");
        return;
    }

    const currentDate = new Date();
    const tournamentDate = `${currentDate.getDate()}/${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`;

    const responseData = await prediction(firstRunner.runnerName, secondRunner.runnerName, tournamentDate, sessionToken);
    if (!responseData || Object.keys(responseData).length === 0) {
        console.log("History data not found.");
        parentPort.postMessage({ success: false, error: "Prediction data not found." });
        return;
    }
    

    const marketBookData = await fetchMarketBook(sessionToken, marketId);
    if (!marketBookData?.result?.length || !marketBookData.result[0].runners.length) {
        console.log("Error: Market Book data is not available.");
        return;
    }

    const runnerData = marketBookData.result[0].runners;
    let back_bet_price, lay_bet_price;
    let selection_Id;

    if (responseData["Prediction"]["0"] === 0) {
        selection_Id = firstRunner.selectionId;
    } else {
        selection_Id = secondRunner.selectionId;
    }

    runnerData.forEach((i) => {
        if (i.selectionId == selection_Id) {
            back_bet_price = i.ex.availableToBack[0].price;
            lay_bet_price = i.ex.availableToLay[0].price;
        }
    });

    console.log("Back Price:", back_bet_price);
    console.log("Lay Price:", lay_bet_price);

    if (back_bet_price == 0 || back_bet_price <= 1.1) {
        console.log("Cannot place bet: Back price is too low.");
        parentPort.postMessage({ success: false, error: "Back price is too low." });
        return;
    }

    if (back_bet_price <= 1.2) {
        lay_bet_price = (back_bet_price - 0.05);
    } else if (back_bet_price > 1.2) {
        lay_bet_price = (back_bet_price - 0.1);
    }
    if (lay_bet_price < 1.05) {
        lay_bet_price = 1.05;
    }

    const backStack = amount / 2;
    const layStack = amount / 2;

    try {
        // const backResponse = await placeBackBet(marketId, selection_Id, back_bet_price, backStack, sessionToken);
        // if (!backResponse || backResponse.result.status !== "SUCCESS") {
        //     console.log("Back bet failed.");
        //     return;
        // }
        backResponse = {
            "jsonrpc": "2.0",
            "result": {
                "marketId": marketId,
                "instructionReports": [
                    {
                        "instruction": {
                            "selectionId": selection_Id,
                            "handicap": 0,
                            "marketOnCloseOrder": {
                                "liability": 2
                            },
                            "orderType": "LIMIT",
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

        console.log("Back bet placed successfully.");
        console.log("backstack" , backStack);
        if(backResponse.error){
            console.error("BACK bet placement failed. Stopping strategy.");
            parentPort.postMessage({ success: false, reason: "BACK bet placement failed" });
            return;
        }
        
        else{
             console.log("Back Bet placed Successfully!!");
                   parentPort.postMessage({ success: true, backResponse, back_bet_price , backStack });
                   try {
                    const response = await axios.post('http://localhost:6060/api/Bhistory');

                  } catch (error) {
                    console.error('Error hitting database API:', error);
                  }
        }
        

        if (backResponse.result.status === "SUCCESS") {
            await monitorMarket(marketId, back_bet_price, lay_bet_price, selection_Id, backStack, sessionToken, matchData, layStack);
        }
    } catch (err) {
        console.error("Error placing back bet:", err);
        parentPort.postMessage({ success: false, error: err.message });
    }
}

async function fetchMarketData(sessionToken, marketId) {
    try {
        const marketBookData = await fetchMarketBook(sessionToken, marketId);
        return marketBookData;
    } catch (err) {
        console.error("Error fetching market data:", err.message);
        return null;
    }
}

async function placeBackBet(marketId, selectionId, price, size, sessionToken) {
    const apiUrl = "https://api.betfair.com/exchange/betting/json-rpc/v1";
    const payload = {
        jsonrpc: '2.0',
        method: "SportsAPING/v1.0/placeOrders",
        params: {
            marketId,
            instructions: [{
                selectionId,
                handicap: 0,
                side: 'BACK',
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
        console.error('Error placing back bet:', error.message);
        return null;
    }
}

async function monitorMarket(marketId, back_bet_price, lay_bet_price, selectionId, backStake, sessionToken, matchData, layStake) {
    let previousLayPrice = lay_bet_price;
    let originalSlPrice = (lay_bet_price + 0.5).toFixed(2);
    let targetPrice = (back_bet_price - 0.2).toFixed(2);
    let slPrice = originalSlPrice;
    let normalLayPrice = lay_bet_price;

     var options = {
        host: 'stream-api.betfair.com',
        port: 443
      }
      try {
        var client = tls.connect(options, function () {
          console.log("Connected");
        });
    
      } catch (err) {
        console.log("error in connection to betfair stream api", err);
    
      }

      const authMessage = JSON.stringify({ "op": "authentication", "appKey": "M90yVlWTGZfS7rEi", "session": sessionToken });

      client.write(authMessage + "\r\n");
    
      const marketSubscription = JSON.stringify({
        op: "marketSubscription",
        id: 1,
        marketFilter: { marketIds: [marketId] },
        marketTypes: ["MATCH_ODDS"],
        marketDataFilter: { fields: ["EX_BEST_OFFERS"], ladderLevels: 1 }
      });
      
      client.write(marketSubscription + "\r\n");


      const odds_data = {};
      //Function to get live odds from the stream-api
      client.on('data', async function getLiveOdds(data) {
        console.log("-----------------------------------");
        const decodedData = data.toString();
      
        if (!decodedData) {
          console.log("Not receiving data anymore from the server!!!!");
        console.log("connection");
        
          client.end(); // Close the connection
          return;
        }
      
        console.log("Market Data:", decodedData);
      
        try {
    
          const response = JSON.parse(decodedData);
      
          if (response.op === "mcm" && response.mc) {
            for (const market of response.mc) {
              if (market.marketDefinition) {
                market_status = market.marketDefinition.status;
                console.log(`Market Status Updated: ${market_status}`);
              }
      
              const market_id = market.id;
      
              if (market.rc) {
                for (const runner of market.rc) {
                  const player_id = runner.id;
      
                  if (!odds_data[player_id]) {
                    odds_data[player_id] = {};
                  }
      
                  if (runner.batb && Array.isArray(runner.batb) && runner.batb[0]) {
                    const back_odds = runner.batb[0][1];
                    if (back_odds !== 0) {
                      odds_data[player_id].back_odds = back_odds;
                    } else {
                      logger.info(`Back odds are not available: ${back_odds}`);
                    }
                  }
      
                  // Safely get best lay odds, checking for null/undefined
                  if (runner.batl && Array.isArray(runner.batl) && runner.batl[0]) {
                    const lay_odds = runner.batl[0][1];
                    if (lay_odds !== 0) {
                      odds_data[player_id].lay_odds = lay_odds;
                    } else {
                      logger.info(`Lay odds are not available: ${lay_odds}`);
                    }
                  }
                }
      
                console.log(odds_data);
    
    
              }
            }
          }
    
    
    
      
          if (Object.keys(odds_data).length === 0) {
            console.log("No odds data available");
            return; // continue waiting for data
          }
          
      


      const currentLayBetPrice =  odds_data[`${selectionId}`].lay_odds || NaN;
      const currentBackBetPrice = odds_data[`${selectionId}`].back_odds  || NaN;
      
      if (Number.isNaN(currentLayBetPrice) || Number.isNaN(currentBackBetPrice)) {
        console.log("None prices");
        return;
      }

          

            console.log(`Current Back Price: ${currentBackBetPrice}, Current Lay Price: ${currentLayBetPrice}`);
            console.log("\n");
    
            
            if (currentLayBetPrice - normalLayPrice > 0.50) {
                console.log("Abnormal Lay price");
                return;
            } else {
                normalLayPrice = currentLayBetPrice;
            }
            
            // Update prices based on conditions
            if (currentLayBetPrice < previousLayPrice) {
                [targetPrice, slPrice] = updatePrices(currentBackBetPrice, currentLayBetPrice, back_bet_price, lay_bet_price, targetPrice, slPrice);
                previousLayPrice = currentLayBetPrice;
            }
            
            if (currentLayBetPrice >= back_bet_price) {
                slPrice = originalSlPrice;
                previousLayPrice = currentLayBetPrice;
            }

            console.log("Taregrt ", targetPrice );
            console.log("Sl price " , slPrice);
            console.log("back bet ", back_bet_price);
            
            
            

            const status = await checkExitConditions(currentBackBetPrice, currentLayBetPrice, targetPrice, slPrice, backStake, back_bet_price, selectionId, marketId, sessionToken, matchData, layStake);
            // console.log(status);

            if (status.success) {
                console.log("lay bet placed");
                client.off("data" , getLiveOdds);
                console.log("lay bet placed and connection shut down");
                
                return ;
                
              }

            }catch(err){
                console.log("Error in monitoring loop",err);
                
              }
    

})

client.on('end', () => {
    console.log('Connection closed by server.');
  });
client.on('error', (err) => {
  console.error('Error with SSL socket:', err);
});



function updatePrices(currentBackBetPrice, currentLayBetPrice, back_bet_price, lay_bet_price, targetPrice, slPrice) {
    if (currentLayBetPrice < back_bet_price) {
        if (currentLayBetPrice >= back_bet_price - 0.1) {
            slPrice = (currentLayBetPrice + 0.5).toFixed(2);
        } else if (back_bet_price > 1.5 && (back_bet_price - currentLayBetPrice) >= 0.2) {
            slPrice = (currentLayBetPrice + 0.05).toFixed(2);
        } else if (back_bet_price <= 1.5 && (back_bet_price - currentLayBetPrice) >= 0.1) {
            slPrice = (currentLayBetPrice + 0.05).toFixed(2);
        } else {
            slPrice = (currentLayBetPrice + 0.1).toFixed(2);
        }
    }

    targetPrice = Math.max((currentBackBetPrice - 0.2).toFixed(2), 1.01);
    return [targetPrice, slPrice];
}

async function checkExitConditions(currentBackBetPrice, currentLayBetPrice, targetPrice, slPrice, backStake, back_bet_price, selectionId, marketId, sessionToken, matchData, layStake) {
    if (currentLayBetPrice <= targetPrice) {
        console.log("---------------------");

    // if(true){
        console.log("Lay condition met: Placing lay bet at target price.");
        // const layBetResponse = await placeLayBet(marketId, selectionId, currentLayBetPrice, layStake, sessionToken);
        const layResponse = {
            "jsonrpc": "2.0",
            "result": {
                "marketId": marketId,
                "instructionReports": [
                    {
                        "instruction": {
                            "selectionId": selectionId,
                            "handicap": 0,
                            "limitOrder": {
                                "size": layStake,
                                "price": currentLayBetPrice,
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
       
             parentPort.postMessage({success:true , layResponse , layStake})
             
             try {
                 const response = await axios.post('http://localhost:6060/api/Lhistory');
                 return  ({ success: true, layResponse: layResponse });
             } catch (error) {
               console.error('Error hitting API:', error.message);
             }
           
        
    
    }

    if (currentLayBetPrice >= slPrice) {
        console.log("Stop loss condition met: Placing lay bet at stop loss price.");
        // const layBetResponse = await placeLayBet(marketId, selectionId, currentLayBetPrice, layStake, sessionToken);
        const layResponse = {
            "jsonrpc": "2.0",
            "result": {
                "marketId": marketId,
                "instructionReports": [
                    {
                        "instruction": {
                            "selectionId": selectionId,
                            "handicap": 0,
                            "limitOrder": {
                                "size": layStake,
                                "price": currentLayBetPrice,
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
       
             parentPort.postMessage({success:true , layResponse , layStake})
             
             try {
                 const response = await axios.post('http://localhost:6060/api/Lhistory');
                 return  ({ success: true, layResponse: layResponse });
             } catch (error) {
               console.error('Error hitting API:', error.message);
             }
           
    }

    return ({success : false});
}

async function placeLayBet(marketId, selectionId, price, size, sessionToken) {
    const apiUrl = "https://api.betfair.com/exchange/betting/json-rpc/v1";
    const payload = {
        jsonrpc: '2.0',
        method: "SportsAPING/v1.0/placeOrders",
        params: {
            marketId,
            instructions: [{
                selectionId,
                handicap: 0,
                side: 'LAY',
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
        console.error('Error placing lay bet:', error.message);
        return null;
    }
}

// Helper function to extract back and lay prices from market data
function getBothPrice(marketBookData, selectionId) {

    const runner = marketBookData.runners.find(r => r.selectionId === selectionId);
    if (runner) {
        return {
            currentBackBetPrice: runner.ex.availableToBack[0]?.price || 0,
            currentLayBetPrice: runner.ex.availableToLay[0]?.price || 0,
        };
    }
    return { currentBackBetPrice: 0, currentLayBetPrice: 0 };
}}



parentPort.on("message", async (data) => {
    await processStrategy1(data.sessionToken, data.marketId, data.amount, data.matchData);
});



 
 