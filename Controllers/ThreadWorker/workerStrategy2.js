const { parentPort } = require('worker_threads');
const axios = require('axios');
const { fetchMarketBook } = require('../marketBook')

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
        // console.log(response.data);


        return response.data;
    } catch (err) {
        console.error("Prediction API Error:", err.message);
        // return null;
    }
}

const processStrategy2 = async (sessionToken, marketId, amount, matchData) => {
    try {
        console.log("I am from Strategy 2");

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
        console.log(responseData);

        const responseLength = Object.keys(responseData).length
        //  console.log(responseLength);

        const marketBookData = await fetchMarketBook(sessionToken, marketId)
        const runner1 = marketBookData.result[0].runners[0];
        const firstBackOdds = runner1.ex.availableToBack?.[0]?.price || null;

        const firstLayOdds = runner1.ex.availableToLay?.[0]?.price || null;
        // console.log(firstBackOdds, firstLayOdds);
        const selection_Id = firstRunner.selectionId

        const prob_Star = 1 / (firstBackOdds + firstLayOdds);
        console.log("prob star" , prob_Star);


        if (responseLength == 0) {
            // return responseData.status(200).json({message : "Cant predict"})
            console.log("Cant predict");
            return;

        }
        else {
            if ((responseData["Player1_Win_prob (0)"]["0"]) > prob_Star) {
                const betData = {
                    selection_Id,
                    marketId,
                    side: "BACK",
                    size: amount,
                    price: firstBackOdds,
                }
                // const backResponse = await placeBettt(betData , sessionToken);
                // console.log(backResponse);
                console.log("Back Bet Placed " , firstBackOdds );
                console.log("Strategy 2 completed");
                parentPort.postMessage({ success: true, backResponse  });
                // return backResponse;

            }
            else {
                const betData = {
                    selection_Id,
                    marketId,
                    side: "LAY",
                    // size : "0",
                    size: amount,
                    price: firstLayOdds,
                }
                //   const layResponse = await placeBettt(betData , sessionToken);
                //   console.log(layResponse);
                console.log("Lay Bet Placed" , firstLayOdds);
                console.log("Strategy 2 completed");
                parentPort.postMessage({ success: true, layResponse  });

                return layResponse;


            }

        }
       
    }
    catch (err) {
        console.log(err);
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
    await processStrategy2(data.sessionToken, data.marketId, data.amount, data.matchData);
});
