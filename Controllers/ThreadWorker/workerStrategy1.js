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
        // console.log(response.data);
        

        return response.data;
    } catch (err) {
        console.error("Prediction API Error:", err.message);
        // return null;
    }
}



const processStrategy1 =  async(sessionToken, marketId, amount , matchData) => {
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
        
        if(responseLength == 0){
            console.log("data not found");
            
        }

        const marketBookData = await fetchMarketBook(sessionToken, marketId);
        // if (!marketBookData?.result?.length || !marketBookData.result[0].runners.length) {
        //     console.log("Error: Market Book data is not available.");
        //     return;
        // }

        const runner1 = marketBookData.result[0].runners;
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

        runner1.map((i) => {
            if (i.selectionId == selection_Id) {
                backOdds = i.ex.availableToBack[0].price;
                layOdds = i.ex.availableToLay[0].price;
            }

        })
        console.log(backOdds, layOdds);

        let lastPriceTraded = backOdds;
      

        if(lastPriceTraded == 0){
            console.log("You cannot place bet");  
        }
        if(lastPriceTraded <= 1.1){
            console.log("Bet price is low");
            
        }

        if (lastPriceTraded <= 1.2) {
            layPrice = (lastPriceTraded - 0.05);
        } else if(lastPriceTraded > 1.2)
         {
            layPrice = (lastPriceTraded - 0.1);
        }
        if(layPrice<1.05){
            layPrice = 1.05;
        }

        // layPrice = Math.max(layPrice, 1.05);
        backStack = amount/2;
        layStack = amount/2;
        try{

            const betData = {
                selection_Id,
                marketId,
                side: 'BACK',
                size: backStack,
                price: lastPriceTraded,
            };
            console.log("Back bet placed At : " ,  lastPriceTraded);
    
            // const backResponse = await placeBettt(betData, sessionToken);
           
    
            let layBetList = [100, 100, 100, 100, 100, 100];
            let index = 5;
            // if (backResponse?.result?.status === 'SUCCESS') {
            if(true){
                while (true) {
                    console.log("\n");
                    
                    console.log("Checking market conditions...");

                    const updatedMarketBook = await fetchMarketBook(sessionToken, marketId);
                    const updatedRunner = updatedMarketBook.result[0].runners.find(r => r.selectionId === selection_Id);
    
                    const updatedLayPrice = updatedRunner.ex.availableToLay?.[0]?.price || null;
                         console.log("Updated lay price : " , updatedLayPrice );
                         console.log("Selection Id : ", selection_Id);
                         console.log("Market Id : " , marketId);
                         console.log("index is : " , index );
                         
                         
                         
                         
                    const backBetPrice = lastPriceTraded;
    
                    if (marketBookData.status === 'CLOSED') {
                        return res.status(200).json({ message: "betting closed" })
                    }
    
                    if (updatedLayPrice < (backBetPrice - 0.01) && layBetList[index] !== updatedLayPrice) {
                        layBetList.push(updatedLayPrice);
                        index = index + 1;
                    }
                    console.log("Lay odd List is ", layBetList);
                    if(layBetList[index - 5] < layBetList[index]){
    
                        const betData = {
                            selection_Id,
                            marketId,
                            side: 'LAY',
                            size: layStack,
                            price: layBetList[index]
                        }
                        // const layResponse = await placeBettt(betData, sessionToken);
    
                        // console.log("LAY Bet Response: ", layResponse);
                        console.log("Lay bet placed - 1 "  , layBetList[index]);
                        
                        break;
                    }
                    if(backBetPrice > 1.5){
                        if(layBetList[index] < (backBetPrice - 0.1)){
                            const betData = {
                                selection_Id,
                                marketId,
                                side: 'LAY',
                                size: layStack,
                                price: layBetList[index]
                            }
                            // const layResponse = await placeBettt(betData, sessionToken);
    
                            // console.log("LAY Bet Response: ", layResponse);
                            console.log("Lay bet placed - 2 "  , layBetList[index]);
    
                            break;
                        }
                    }
                    else{
                        if (layBetList[index] < (backBetPrice - 0.05)) {
    
                            const betData = {
                                selection_Id,
                                marketId,
                                side: 'LAY',
                                size: layStack,
                                price: layBetList[index]
                            }
                            // const layResponse = await placeBettt(betData, sessionToken);
    
                            // console.log("LAY Bet Response: ", layResponse);
                            console.log("Lay bet placed - 3 "  , layBetList[index]);
    
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
                        // const layResponse = await placeBettt(betData, sessionToken);
    
                        // console.log("LAY Bet Response: ", layResponse);
                        console.log("Lay bet placed - 4 "  , layBetList[index]);
    
                        break;
                    }
    
                    await new Promise(resolve => setTimeout(resolve, 30000));
                }
            }
    
            parentPort.postMessage({ success: true, marketId });
        }
        catch(err){
                 console.log(err);
                 
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

