const { fetchMarketBook } = require('../Controllers/marketBook')
const axios = require('axios');
const AllData = require('../services/AllData')

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
        console.error("Error Details:", err.response ? err.response.data : err.message);
    }
}

const fetchStrategy1 = async (sessionToken, marketId, amount) => {
    try {
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

        const responseData = await prediction(firstRunner.runnerName, secondRunner.runnerName, tournamentDate, sessionToken)

        const responseLength = Object.keys(responseData).length;

        if (responseLength == 0) {
            console.log("data not found");
            return;

        }
        const marketBookData = await fetchMarketBook(sessionToken, marketId)


        const runnersData = marketBookData.result[0].runners;
        // console.log(runnersData.ex);

        let backOdds, layOdds, layPrice
        let selection_Id;
        let prob;

        if (responseData["Prediction"]["0"] === 0) {
            selection_Id = firstRunner.selectionId;
            prob = responseData["Player1_Win_prob (0)"]["0"];
        }
        else {
            selection_Id = secondRunner.selectionId;
            prob = responseData["Player2_Win_prob (1)"]["0"];
        }

        runnersData.map((i) => {
            if (i.selectionId == selection_Id) {
                backOdds = i.ex.availableToBack[0].price;
                layOdds = i.ex.availableToLay[0].price;
            }

        })
        console.log(backOdds, layOdds);

        lastPriceTraded = backOdds;

        if (lastPriceTraded == 0) {
            console.log("You cant");
            return;
        }
        if (lastPriceTraded <= 1.1) {
            console.log("You cant");
            return;

        }
        if (lastPriceTraded <= 1.2) {
            layPrice = (lastPriceTraded - 0.05);
        }
        else if (lastPriceTraded > 1.2) {
            layPrice = (lastPriceTraded - 0.1);
        }

        if (layPrice < 1.05) {
            layPrice = 1.05;
        }
          var backStack , layStack;
        backStack = amount / 2;
        layStack = amount / 2;

        try {
            try {

                const betData = {
                    selection_Id,
                    marketId,
                    side: 'BACK',
                    size: backStack,
                    price: lastPriceTraded,
                };
                // var backResponse = await placeBettt(betData, sessionToken);
                // var statuss = backResponse.result.status;
                var statuss = "SUCESS" 

                if (!backResponse) {
                    console.log("back bet failed");
                    return;
                }
                else {
                    console.log("Back bet placed At : ", lastPriceTraded);
                    // return backResponse;

                }

            } catch (err) {
                console.log("error placing back bet", err);

            }



            //   if (backResponse.error) {
            //     console.error("BACK bet placement failed. Stopping strategy.");
            //     return;
            //   }

            let layBetList = [100, 100, 100, 100, 100, 100];
            let index = 5;
            let layResponse = null;

            if (statuss === 'SUCESS') {
                // if(true){
                while (true) {
                    console.log("\n");

                    console.log("Fetching Market Book again for LAY conditions...");

                    const updatedMarketBook = await fetchMarketBook(sessionToken, marketId);
                    const updatedRunner = updatedMarketBook.result[0].runners.find(r => r.selectionId === selection_Id);


                    const updatedLayPrice = updatedRunner.ex.availableToLay?.[0]?.price || NaN;
                    console.log(updatedLayPrice); 
                    console.log("Updated lay price : ", updatedLayPrice);
                    console.log("Selection Id : ", selection_Id);
                    console.log("Market Id : ", marketId);
                    console.log("index is : ", index);

                    const backBetPrice = lastPriceTraded;

                    if (marketBookData.status === 'CLOSED') {
                        return res.status(200).json({ message: "betting closed" })
                        // break;
                    }
                    if (updatedLayPrice < (backBetPrice - 0.01) && layBetList[index] !== updatedLayPrice) {
                        layBetList.push(updatedLayPrice);
                        index = index + 1;
                    }


                    if (layBetList[index - 5] < layBetList[index]) {

                        const betData = {
                            selection_Id,
                            marketId,
                            side: 'LAY',
                            size: layStack,
                            price: layBetList[index]
                        }
                        //  layResponse = await placeBettt(betData, sessionToken);

                        // console.log("LAY Bet Response: ", layResponse);
                        console.log("Lay bet placed - 1 ", layBetList[index]);

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

                            // console.log("LAY Bet Response: ", layResponse);
                            console.log("Lay bet placed - 2 ", layBetList[index]);

                            break;
                        }
                    } else {
                        if (layBetList[index] < (backBetPrice - 0.05)) {

                            const betData = {
                                selection_Id,
                                marketId,
                                side: 'LAY',
                                size: layStack,
                                price: layBetList[index]
                            }
                            //  layResponse = await placeBettt(betData, sessionToken);

                            // console.log("LAY Bet Response: ", layResponse);
                            console.log("Lay bet placed - 3 ", layBetList[index]);


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

                        // console.log("LAY Bet Response: ", layResponse);
                        console.log("Lay bet placed - 4 ", layBetList[index]);


                        break;
                    }


                    // Wait for 30 seconds before checking again
                    await new Promise(resolve => setTimeout(resolve, 30000));
                }
            }

            return { backResponse, layResponse };

        }
        catch (err) {
            console.log(err);
        }
    }
    catch (err) {
        console.log(err);

    }

}

async function placeBettt(strategyData, sessionToken) {

    const { selection_Id, marketId, side, size, price } = strategyData;
    // console.log(selection_Id  , marketId , side , size , price);

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
                    selectionId: selection_Id,
                    handicap: 0,
                    side: side,
                    orderType: "LIMIT",
                    limitOrder: {
                        size: parseFloat(size),
                        price: parseFloat(price),
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

module.exports = { fetchStrategy1 }