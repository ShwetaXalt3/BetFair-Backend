const { parentPort } = require('worker_threads');
const axios = require('axios');
const { fetchMarketBook } = require('../marketBook');

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
        console.log(response.data);


        return response.data;
    } catch (err) {
        console.error("Prediction API Error:", err.message);
        // return null;
    }
}



const processStrategy1 = async (sessionToken, marketId, amount, matchData) => {
    try {
        console.log(`Processing Strategy 1 for Market ID: ${marketId}`);
        // const allData = AllData.getAllData();
        // const matchData = allData.matchh;
        // console.log(matchData);




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

        const responseData = await prediction(firstRunner.runnerName, secondRunner.runnerName, tournamentDate, sessionToken);
        const responseLength = Object.keys(responseData).length;

        if (responseLength == 0) {
            console.log("data not found");
            parentPort.postMessage({ success: false, error: "Api hit success but in prediction data not found" });
            return

        }

        const marketBookData = await fetchMarketBook(sessionToken, marketId);

        // if (!marketBookData?.result?.length || !marketBookData.result[0].runners.length) {
        //     console.log("Error: Market Book data is not available.");
        //     return;
        // }

        const runnerData = marketBookData.result[0].runners;
        console.log(runnerData);
        let backOdds, layOdds, layPrice
        let selection_Id;
        let prob;

        if (responseData["Prediction"]["0"] === 0) {
            selection_Id = firstRunner.selectionId;
            prob = responseData["Player1_Win_prob (0)"]["0"];
        } else {
            selection_Id = secondRunner.selectionId;
            prob = responseData["Player2_Win_prob (1)"]["0"];
        }

        runnerData.map((i) => {
            if (i.selectionId == selection_Id) {
                backOdds = i.ex.availableToBack[0].price;
                layOdds = i.ex.availableToLay[0].price;
            }

        })
        console.log("Bakcodd" , backOdds);
        console.log("Layodds" , layOdds);
        
        

        let lastPriceTraded = backOdds;


        if (lastPriceTraded == 0) {
            console.log("You cannot place bet");
            const val = "You cannot place bet"
            parentPort.postMessage({ success: false, val })
            return;
        }
        if (lastPriceTraded <= 1.1) {
            console.log("Bet price is low");
            const val = "Bet Price is Low"
            parentPort.postMessage({ success: false, val })
            return;

        }

        if (lastPriceTraded <= 1.2) {
            layPrice = (lastPriceTraded - 0.05);
        } else if (lastPriceTraded > 1.2) {
            layPrice = (lastPriceTraded - 0.1);
        }
        if (layPrice < 1.05) {
            layPrice = 1.05;
        }

        // layPrice = Math.max(layPrice, 1.05);
        var backStack, layStack;
        backStack = amount / 2;
        layStack = amount / 2;

        //-------------Back bet try catch--------------------------
     
            try {
                const betData = {
                    selection_Id,
                    marketId,
                    side: 'BACK',
                    size: backStack,
                    price: lastPriceTraded,
                };
                console.log("Back bet placed At : ", lastPriceTraded);

                // var backResponse = await placeBettt(betData, sessionToken);
                // var backResponse = "Hi i am back response from strategy -1 "
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
                // var statuss = "SUCCESS";

                if (!backResponse) {
                    console.log("Back bet failed");
                    return;
                }
                else {
                    console.log("Back bet placed", lastPriceTraded);
                    parentPort.postMessage({ success: true, backResponse });

                }
            } catch (err) {
                console.error("Error placing back bet", err);
          parentPort.postMessage({ success: false, error: err.message });
            }


         //------------------Lay bet try catch-----------------
                try{

                    let layBetList = [100, 100, 100, 100, 100, 100];
                let index = 5;
                var layResponse = null
                // if (backResponse?.result?.status === 'SUCCESS') {
                if (statuss === "SUCESS") {
                    while (true) {
                        console.log("\n");
    
                        console.log("Checking market conditions...");
    
                        const updatedMarketBook = await fetchMarketBook(sessionToken, marketId);
                        const updatedRunner = updatedMarketBook.result[0].runners.find(r => r.selectionId === selection_Id);
    
                        const updatedLayPrice = updatedRunner.ex.availableToLay?.[0]?.price || NaN;
                        console.log("Updated lay price : ", updatedLayPrice);
                        console.log("Selection Id : ", selection_Id);
                        console.log("Market Id : ", marketId);
                        console.log("index is : ", index);
    
    
    
    
                        const backBetPrice = lastPriceTraded;
    
                        if (marketBookData.status === 'CLOSED') {
                            return res.status(200).json({ message: "betting closed" })
                        }
    
                        if (updatedLayPrice < (backBetPrice - 0.01) && layBetList[index] !== updatedLayPrice) {
                            layBetList.push(updatedLayPrice);
                            index = index + 1;
                        }
                        console.log("Lay odd List is ", layBetList);
    
                        if (layBetList[index - 5] < layBetList[index]) {
    
                            const betData = {
                                selection_Id,
                                marketId,
                                side: 'LAY',
                                size: layStack,
                                price: layBetList[index]
                            }
                            //  layResponse = await placeBettt(betData, sessionToken);
                            layResponse =  {
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
                                const betData = {
                                    selection_Id,
                                    marketId,
                                    side: 'LAY',
                                    size: layStack,
                                    price: layBetList[index]
                                }
                                //  layResponse = await placeBettt(betData, sessionToken);
                                layResponse =  {
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
                        }
                        else {
                            if (layBetList[index] < (backBetPrice - 0.05)) {
    
                                const betData = {
                                    selection_Id,
                                    marketId,
                                    side: 'LAY',
                                    size: layStack,
                                    price: layBetList[index]
                                }
                                //  layResponse = await placeBettt(betData, sessionToken);
                                layResponse =  {
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
    
                            const betData = {
                                selection_Id,
                                marketId,
                                side: 'LAY',
                                size: layStack,
                                price: layBetList[index]
                            }
                            //  layResponse = await placeBettt(betData, sessionToken);
                            layResponse =  {
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
    
                        await new Promise(resolve => setTimeout(resolve, 30000));
                    }
                    parentPort.postMessage({ success: true, backResponse, layResponse });
                }
    
     

                }catch(err){
                    console.log("Error placing lay bet", err);
                    parentPort.postMessage({ success: false, error: err.message });
                }
                     


    } catch (err) {
        console.error("Worker Error:", err);
        parentPort.postMessage({ success: false, error: err.message });
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
    await processStrategy1(data.sessionToken, data.marketId, data.amount, data.matchData);
});

