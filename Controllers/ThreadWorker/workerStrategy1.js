const { parentPort } = require('worker_threads');
const axios = require('axios');
const { fetchMarketBook } = require('../marketBook');
const tls = require('tls');
const { setupLogger } = require('../../logger');
const { setLogger } = require('../../logger');
const { cli } = require('winston/lib/winston/config');
const { error } = require('console');
const { match } = require('assert');
const logger = setLogger("Strategy_1", "logs/Betting_data.log");

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

async function placeBettt(strategyData, sessionToken) {
    const { selectionId, marketId, side, size, price } = strategyData;
    const apiUrl = "https://api.betfair.com/exchange/betting/json-rpc/v1";

    const payload = {
        jsonrpc: '2.0',
        method: "SportsAPING/v1.0/placeOrders",
        params: {
            marketId,
            instructions: [{
                selectionId: selectionId,
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
async function backResponsefn(marketId, selectionId) {
    const backResponse = {
        "jsonrpc": "2.0",
        "result": {
            "marketId": marketId,
            "instructionReports": [
                {
                    "instruction": {
                        "selectionId": selectionId,
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
    };
    return backResponse;


}

async function layResponsefn(marketId, selectionId, layStack, current_lay_bet_price) {
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
                            "size": layStack,
                            "price": current_lay_bet_price,
                            "persistenceType": "LAPSE"
                        },
                        "orderType": "LIMIT",
                        "side": "LAY"
                    },
                    "betId": "31242604945",
                    "placedDate": new Date().toISOString(),
                    "averagePriceMatched": 0,
                    "sizeMatched": 0,
                    "status": "SUCCESS"
                }
            ],
            "status": "SUCCESS"
        },
        "id": 1
    };
    return layResponse;

}

async function fetchLiveOdds(sessionToken, marketId) {
    return new Promise((resolve, reject) => {
        const options = {
            host: 'stream-api.betfair.com',
            port: 443
        }
        let odds_data = {};
        let market_status = null;
        try {
            const client = tls.connect(options, function () {
                logger.info("TLS connected to Betfair stream API");

                // Authentication message
                const authMessage = JSON.stringify({
                    "op": "authentication",
                    "appKey": process.env.API_KEY || "M90yVlWTGZfS7rEi",
                    "session": sessionToken
                });

                client.write(authMessage + "\r\n");

                const marketSubscription = JSON.stringify({
                    op: "marketSubscription",
                    id: 1,
                    marketFilter: { marketIds: [marketId] },
                    marketDataFilter: { fields: ["EX_BEST_OFFERS"], ladderLevels: 1 }
                });
                client.write(marketSubscription + "\r\n");

            })

            const timeout = setTimeout(() => {
                client.end();
                reject(new Error("Time out waiting for odds data"));
            }, 15000)

            client.on('data', (data) => {
                clearTimeout(timeout);

                const decodedData = data.toString();
                if (!decodedData) {
                    logger.info("Not receiving data from the server");
                    client.end();
                    reject(new Error("No data received from stream API"));
                    return;
                }
                logger.info("Market data received: " + decodedData);
                try {
                    const marketData = JSON.parse(decodedData);
                    if (marketData.op === "connection" && marketData.connectionId) {
                        logger.info("Connected to stream logger.info marketData.connectionId");
                        return;
                    }
                    if (marketData.op === "status" && marketData.connectionClosed) {
                        reject(new Error("Connection closed by Betfair: " + marketData.errorMessage));
                        client.end();
                        return;
                    }

                    //Process market data
                    if (marketData.op === "mcm" && marketData.mc) {
                        for (const market of marketData.mc) {
                            if (market.marketDefinition) {
                                market_status = market.marketDefinition.status;
                                logger.info("Market Status updated: " + market_status);
                            }

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

                                    if (runner.batl && Array.isArray(runner.batl) && runner.batl[0]) {
                                        const lay_odds = runner.batl[0][1];
                                        if (lay_odds !== 0) {
                                            odds_data[player_id].lay_odds = lay_odds;
                                        } else {
                                            logger.info(`Lay odds are not available: ${lay_odds}`);
                                        }
                                    }
                                }

                                logger.info("Processed odds data: " + odds_data);
                                client.end();
                                resolve({ odds_data, market_status });
                                return;
                            }
                        }
                    }

                } catch (err) {
                    logger.error("Error processing stream data: " + err);
                    client.end();
                    reject(err);
                }
            });

            client.on('error', (err) => {
                logger.error("TLS connection error: " + err);
                clearTimeout(timeout);
                reject(err);
            });

            client.on('end', () => {
                logger.info("TLS connection closed");
                clearTimeout(timeout);

                // If we have data but connection ended, still return what we have
                if (Object.keys(odds_data).length > 0) {
                    resolve({ odds_data, market_status });
                } else {
                    reject(new Error("Connection closed without receiving odds data"));
                }
            });

        } catch (err) {
            logger.error("Error setting up TLS connection: " + err);
            reject(err);
        }
    });
}

const processStrategy1 = async (sessionToken, marketId, amount, matchData) => {
    try {


        logger.info(`Processing Strategy 1 for Market ID: ${marketId}`);

        if (matchData?.result && Array.isArray(matchData.result)) {
            const market = matchData.result.find(matchh => matchh.marketId === marketId);

            if (market?.runners?.length > 0) {
                var firstRunner = market.runners[0];
                var secondRunner = market.runners[1];
            } else {
                logger.error("Error: No runners found for the given marketId.");
                return;
            }
        } else {
            logger.error("Error: matchData.result is not available or not an array.");
            return;
        }

        const currentDate = new Date();
        const tournamentDate = `${currentDate.getDate()}/${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`;

        const responseData = await prediction(firstRunner.runnerName, secondRunner.runnerName, tournamentDate, sessionToken);
        if (!responseData || Object.keys(responseData).length === 0) {
            logger.info("Prediction data not found.");
            parentPort.postMessage({ success: false, error: "Prediction data not found." });
            return;
        }


        const marketBookData = await fetchMarketBook(sessionToken, marketId);
        if (!marketBookData?.result?.length || !marketBookData.result[0].runners.length) {
            logger.error("Error: Market Book data is not available.");
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

        //-----------------Logger match-----------------
        var runnername1 = null
        var runnername2 = null;
        const data = matchData.result;
        data.map((i) => {
            if (i.marketId == marketId) {
                runnername1 = i.runners[0].runnerName;
                runnername2 = i.runners[1].runnerName;
            }
        })

        //logger file
        const strategyName = "Strategy 1"
        const matchName = `${runnername1} VS ${runnername2}`;
        const match = setupLogger(matchName, strategyName);

        runnerData.forEach((i) => {
            if (i.selectionId == selection_Id) {
                back_bet_price = i.ex.availableToBack[0].price;
                lay_bet_price = i.ex.availableToLay[0].price;
            }
        });

        logger.info("Back Price: " + back_bet_price);
        logger.info("Lay Price: " + lay_bet_price);

        if (back_bet_price == 0 || back_bet_price <= 1.1) {
            logger.info("Cannot place bet: Back price is too low.");
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
        //---------------In strategy 1 back stake is with backstackkkkk-------
        const backStack = amount / 2;
        const layStack = amount / 2;
        var backResponse;
        var statuss;

        try {
            const betData = {
                selection_Id,
                marketId,
                side: 'BACK',
                size: backStack,
                price: back_bet_price,
            };
            // const backResponse = await placeBackBet(marketId, selection_Id, back_bet_price, backStack, sessionToken);
            backResponse = await backResponsefn(marketId, selection_Id)
            statuss = backResponse.result.status;


            if (backResponse.error) {
                logger.error("BACK bet placement failed. Stopping strategy.");
                parentPort.postMessage({ success: false, reason: "BACK bet placement failed" });
                return;
            }
            else {
                logger.info("Back Bet placed Successfully!!!!! at " + back_bet_price);
                parentPort.postMessage({ success: true, backResponse, back_bet_price, backStack });

            }
        } catch (err) {
            logger.error("Error placing back bet: " + err);
            parentPort.postMessage({ success: false, error: err.message });
            return;
        }
        if (statuss === "SUCCESS") {
            try {
                const layResponse = await monitorMarket(
                    marketId,
                    back_bet_price,
                    lay_bet_price,
                    selection_Id,
                    backStack,
                    sessionToken,
                    matchData,
                    layStack,
                    match
                );
                console.log("Layresponse from process Strategy++", layResponse);

                if (layResponse && layResponse.success) {
                    parentPort.postMessage({
                        success: true,
                        layResponse: layResponse.layResponse,
                        layStack: layResponse.layStack
                    });
                    return;
                }

            } catch (err) {
                logger.error("Error in lay monitoring: " + err);
                parentPort.postMessage({
                    success: false,
                    error: `Lay monitoring error: ${err.message}`,
                    stage: "lay_monitoring"
                });
                return;
            }
        }
    } catch (err) {
        logger.error("error in whole code " + err);
        parentPort.postMessage({ success: false, error: err.message });

    }

};

async function monitorMarket(marketId, back_bet_price, lay_bet_price, selectionId, backStake, sessionToken, matchData, layStack, match) {
    let previousLayPrice = lay_bet_price;
    let originalSlPrice = parseFloat((lay_bet_price + 0.5).toFixed(2));
    let targetPrice = parseFloat((back_bet_price - 0.2).toFixed(2));
    let slPrice = originalSlPrice;
    let normalLayPrice = lay_bet_price;

    match.info("Starting market monitoring with initial values:");
    match.info(`Back Bet Price: ${back_bet_price}`);
    match.info(`Initial Lay Price: ${lay_bet_price}`);
    match.info(`Target Price: ${targetPrice}`);
    match.info(`Stop Loss Price: ${slPrice}`);

    try {

        let streamResponse = await fetchLiveOdds(sessionToken, marketId);
        let odds_data = streamResponse.odds_data;
        let market_status = streamResponse.market_status;
        match.info("Initial stream data: " + odds_data);

        let monitoring = true;
        let checkCount = 0;

        while (monitoring) {
            checkCount++;

            try {
                // Get fresh market data
                streamResponse = await fetchLiveOdds(sessionToken, marketId);
                odds_data = streamResponse.odds_data;
                market_status = streamResponse.market_status;

                // Check if market is closed
                if (market_status === 'CLOSED') {
                    match.info("Market is closed. Stopping monitoring.");
                    break;
                }
                const current_back_bet_price = odds_data[`${selectionId}`]?.back_odds;
                const current_lay_bet_price = odds_data[`${selectionId}`]?.lay_odds;

                match.info(`Monitoring check #${checkCount}:`);
                match.info(`Current back: ${current_back_bet_price}`);
                match.info(`Current lay: ${current_lay_bet_price}`);
                match.info(`target price: ${targetPrice}`);
                match.info(`stop loss price: ${slPrice}`);


                if (!current_back_bet_price || !current_lay_bet_price) {
                    match.info("No prices available for this selection. Waiting...");
                    await new Promise(resolve => setTimeout(resolve, 30000));
                    continue;
                }

                if (current_lay_bet_price - normalLayPrice > 0.50) {
                    match.info("Abnormal Lay price");
                    await new Promise(resolve => setTimeout(resolve, 30000));
                    continue;
                } else {
                    normalLayPrice = current_lay_bet_price;
                }

                // Update prices based on conditions
                if (current_lay_bet_price < previousLayPrice) {
                    [targetPrice, slPrice] = updatePrices(current_back_bet_price, current_lay_bet_price, back_bet_price, lay_bet_price, targetPrice, slPrice);

                    previousLayPrice = current_lay_bet_price;

                    match.info("Prices updated:---------");
                    match.info(`New target price: ${targetPrice}`);
                    match.info(`New stop loss price: ${slPrice}`);
                }

                if (current_lay_bet_price >= back_bet_price) {
                    slPrice = originalSlPrice;
                    previousLayPrice = current_lay_bet_price;
                }

                const exit_status = await checkExitConditions(current_back_bet_price,
                    current_lay_bet_price,
                    targetPrice,
                    slPrice,
                    backStake,
                    back_bet_price,
                    selectionId,
                    marketId,
                    sessionToken,
                    layStack,
                    match
                );


                if (exit_status && exit_status.success) {
                    match.info("Exit condition met. Lay bet placed.");
                    monitoring = false;
                    return exit_status;
                }

                await new Promise(resolve => setTimeout(resolve, 10000));
            } catch (err) {
                match.error(`Market monitoring error: ${err.message}`);
                await new Promise(resolve => setTimeout(resolve, 30000));

            }
        }
        match.info("Market monitoring completed without placing lay bet.");
        return { success: false, reason: "Monitoring period ended without conditions being met" };
    }
    catch (error) {
        match.error("Fatal error in market monitoring:" +  error);
        throw error;
    }
}

function updatePrices(current_back_bet_price, current_lay_bet_price, back_bet_price, lay_bet_price, targetPrice, slPrice) {
    if (current_lay_bet_price < back_bet_price) {
        if (current_lay_bet_price >= back_bet_price - 0.1) {
            slPrice = (current_lay_bet_price + 0.5).toFixed(2);
        } else if (back_bet_price > 1.5 && (back_bet_price - current_lay_bet_price) >= 0.2) {
            slPrice = (current_lay_bet_price + 0.05).toFixed(2);
        } else if (back_bet_price <= 1.5 && (back_bet_price - current_lay_bet_price) >= 0.1) {
            slPrice = (current_lay_bet_price + 0.05).toFixed(2);
        } else {
            slPrice = (current_lay_bet_price + 0.1).toFixed(2);
        }
    }

    targetPrice = Math.max((current_back_bet_price - 0.2).toFixed(2), 1.01);
    return [targetPrice, slPrice];
}

async function checkExitConditions(current_back_bet_price, current_lay_bet_price, targetPrice, slPrice, backStake, back_bet_price, selectionId, marketId, sessionToken, layStack , match) {
    if (current_lay_bet_price <= targetPrice) {
        match.info("Lay condition met: Placing lay bet at target price.");
        const betData = {
            selectionId,
            marketId,
            side: "LAY",
            size: layStack,
            price: current_lay_bet_price,
        };
        // const layResponse = await placeBettt(betData, sessionToken);
        const layResponse = await layResponsefn(marketId, selectionId, layStack, current_lay_bet_price)

        match.info(`LAY bet placed at ${current_lay_bet_price}`);
        parentPort.postMessage({ success: true, layResponse, layStack });

        return { success: true, layResponse, layStack };
    }

    else if (current_lay_bet_price >= slPrice) {
        match.info("Stop loss condition met: Placing lay bet at stop loss price.");

        const betData = {
            selectionId,
            marketId,
            side: "LAY",
            size: layStack,
            price: current_lay_bet_price,
        };
        const layResponse = await layResponsefn(marketId, selectionId, layStack, current_lay_bet_price)
        match.info(`LAY bet placed at ${current_lay_bet_price}`);

        parentPort.postMessage({ success: true, layResponse, layStack });


        return { success: true, layResponse, layStack };
    }

    // **Ensure we return false if no condition is met**
    return { success: false };
}
parentPort.on("message", async (data) => {
    await processStrategy1(data.sessionToken, data.marketId, data.amount, data.matchData);
});