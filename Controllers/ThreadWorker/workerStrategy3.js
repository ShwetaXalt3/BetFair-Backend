// const { parentPort } = require('worker_threads');
// const axios = require('axios');
// const { fetchMarketBook } = require('../marketBook');
// const tls = require('tls');
// function layStakeCalculator(backStake, layBetPrice, backBetPrice) {
//   // console.log("Hello ", backStake, layBetPrice);

//   let layStake = (backStake * backBetPrice) / layBetPrice;
//   layStake = Math.round(layStake * 100) / 100;
//   return layStake;
// }

// const processStrategy3 = async (sessionToken, marketId, amount, matchData) => {
//   try {
//     console.log(`Processing Strategy 3 for Market ID: ${marketId}`);

//     var marketTimes;
//     if (matchData && matchData.result && Array.isArray(matchData.result)) {
//       marketTimes = matchData.result
//         .filter(matchh => matchh.marketId === marketId)
//         .map(matchh => {
//           return matchh.marketStartTime;
//         });
//     } else {
//       console.log("Error: matchData.result is not available or not an array");
//     }

//     const marketBookData = await fetchMarketBook(sessionToken, marketId);

//     if (!marketBookData || !marketBookData.result || marketBookData.result.length === 0) {
//       throw new Error("Invalid market book data");
//     }

//     const runner1 = marketBookData.result[0].runners[0];
//     const runner2 = marketBookData.result[0].runners[1];

//     const firstBackOdds = runner1.ex.availableToBack?.[0]?.price || null;
//     const firstLayOdds = runner1.ex.availableToLay?.[0]?.price || null;
//     const secondBackOdds = runner2.ex.availableToBack?.[0]?.price || null;
//     const secondLayOdds = runner2.ex.availableToLay?.[0]?.price || null;
//     let backBetPrice, selectionId, backStake, layPrice, layBetPrice;

//     if (!firstBackOdds || !secondBackOdds) {
//       const reason = "Back odds not found";
//       parentPort.postMessage({ success: false, reason });
//       return;
//     }

//     if (firstBackOdds > secondBackOdds) {
//       backBetPrice = secondBackOdds;
//       layBetPrice = secondLayOdds;
//       selectionId = runner2.selectionId;
//     } else {
//       backBetPrice = firstBackOdds;
//       layBetPrice = firstLayOdds;
//       selectionId = runner1.selectionId;
//     }

//     if (!backBetPrice) {
//       console.log("Price Not found!!!!!");
//       const reason = "Price Not found!!!!!";
//       parentPort.postMessage({ success: false, reason });
//       return;
//     }

//     if (backBetPrice <= 1.1) {
//       console.log("Back bet is low");
//       const reason = `Back bet is low ${backBetPrice}`;
//       parentPort.postMessage({ success: false, reason });
//       return;
//     }

//     // Fix: Use amount instead of undefined 'size' variable
//     backStake = Math.round(amount / 2 * 10) / 10;
//     var backResponse;

//     // -------------------back bet try catch---------------
//     try {
//       const betData = {
//         selectionId,
//         marketId,
//         side: 'BACK',
//         size: backStake,
//         price: backBetPrice,
//       };
//       console.log(" back bet placed at  ", backBetPrice);

//       //  backResponse = await placeBettt(betData, sessionToken);
//       backResponse = {
//         "jsonrpc": "2.0",
//         "result": {
//           "marketId": marketId,
//           "instructionReports": [
//             {
//               "instruction": {
//                 "selectionId": selectionId,
//                 "handicap": 0,
//                 "marketOnCloseOrder": {
//                   "liability": 2
//                 },
//                 "orderType": "LIMIT",
//                 "side": "BACK"
//               },
//               "betId": "31645233727",
//               "placedDate": "2013-11-12T12:07:29.000Z",
//               "status": "SUCCESS"
//             }
//           ],
//           "status": "SUCCESS"
//         },
//         "id": 1
//       };

//       var statuss = backResponse.result.status;
//       if (backResponse.error) {
//         console.error("BACK bet placement failed. Stopping strategy.");
//         parentPort.postMessage({ success: false, reason: "BACK bet placement failed" });
//         return;
//       }
//       else {
//         console.log("Back Bet placed Successfully!!");
//         parentPort.postMessage({ success: true, backResponse, backBetPrice , backStake });
//         try {
//           const response = await axios.post('http://localhost:6060/api/Bhistory');
//           // console.log(response);

//         } catch (error) {
//           console.error('Error hitting database API:', error.message);
//         }
//       }

//     } catch (err) {
//       console.error("Error placing back bet", err);
//       parentPort.postMessage({ success: false, error: err.message });
//       return;
//     }

//     // ------------------------------Start monitoring for lay bet in background---------------
//     if (statuss === "SUCCESS") {
//       // Continue with lay monitoring in the background
//       monitor_market(marketBookData, backBetPrice, layBetPrice, selectionId, backStake, matchData, marketId, sessionToken)
//         .then(layResponse => {
//           if (layResponse) {
//             // When lay bet is complete, send another message with the lay response
//             parentPort.postMessage({ success: true, layResponse });
//           }
//         })
//         .catch(err => {
//           console.log("Error in lay monitoring:", err);
//           parentPort.postMessage({
//             success: false,
//             error: `Lay monitoring error: ${err.message}`,
//             stage: "lay_monitoring"
//           });
//         });
//     }

//   } catch (err) {
//     console.log("error in whole code", err);
//     parentPort.postMessage({ success: false, error: err.message });
//   }
// };

// async function monitor_market(marketBookData, backBetPrice, layBetPrice, selectionId, backStake, matchData, marketId, sessionToken) {
//   // "Monitor market prices and execute lay bet when conditions are met
//   let previous_lay_price = layBetPrice;
//   let original_sl_price = parseFloat((layBetPrice + 0.5).toFixed(2));
//   let target_price = parseFloat((backBetPrice - 0.2).toFixed(2));
//   let sl_price = original_sl_price;
//   let normal_lay_price = layBetPrice;

//   var options = {
//     host: 'stream-api.betfair.com',
//     port: 443
//   }
//   try {
//     var client = tls.connect(options, function () {
//       console.log("Connected");
//     });

//   } catch (err) {
//     console.log("error in connection to betfair stream api", err);

//   }
//   const authMessage = JSON.stringify({ "op": "authentication", "appKey": "M90yVlWTGZfS7rEi", "session": sessionToken });

//   client.write(authMessage + "\r\n");

//   const marketSubscription = JSON.stringify({
//     op: "marketSubscription",
//     id: 1,
//     marketFilter: { marketIds: [marketId] },
//     marketTypes: ["MATCH_ODDS"],
//     marketDataFilter: { fields: ["EX_BEST_OFFERS"], ladderLevels: 1 }
//   });
  
//   client.write(marketSubscription + "\r\n");




// //Function to get live odds from the stream-api
//   const odds_data = {};
//   client.on('data', async function getLiveOdds(data) {
//     console.log("-----------------------------------");
//     const decodedData = data.toString();
  
//     if (!decodedData) {
//       console.log("Not receiving data anymore from the server!!!!");
//     console.log("connection");
    
//       client.end(); // Close the connection
//       return;
//     }
  
//     console.log("Market Data:", decodedData);
  
//     try {

//       const response = JSON.parse(decodedData);
  
//       if (response.op === "mcm" && response.mc) {
//         for (const market of response.mc) {
//           if (market.marketDefinition) {
//             market_status = market.marketDefinition.status;
//             console.log(`Market Status Updated: ${market_status}`);
//           }
  
//           const market_id = market.id;
  
//           if (market.rc) {
//             for (const runner of market.rc) {
//               const player_id = runner.id;
  
//               if (!odds_data[player_id]) {
//                 odds_data[player_id] = {};
//               }
  
//               if (runner.batb && Array.isArray(runner.batb) && runner.batb[0]) {
//                 const back_odds = runner.batb[0][1];
//                 if (back_odds !== 0) {
//                   odds_data[player_id].back_odds = back_odds;
//                 } else {
//                   logger.info(`Back odds are not available: ${back_odds}`);
//                 }
//               }
  
//               // Safely get best lay odds, checking for null/undefined
//               if (runner.batl && Array.isArray(runner.batl) && runner.batl[0]) {
//                 const lay_odds = runner.batl[0][1];
//                 if (lay_odds !== 0) {
//                   odds_data[player_id].lay_odds = lay_odds;
//                 } else {
//                   logger.info(`Lay odds are not available: ${lay_odds}`);
//                 }
//               }
//             }
  
//             console.log(odds_data);


//           }
//         }
//       }



  
//       if (Object.keys(odds_data).length === 0) {
//         console.log("No odds data available");
//         return; // continue waiting for data
//       }
      
   
//       const current_lay_bet_price =  odds_data[`${selectionId}`].lay_odds || NaN;
//       const current_back_bet_price = odds_data[`${selectionId}`].back_odds  || NaN;
        
//       if (Number.isNaN(current_back_bet_price) || Number.isNaN(current_lay_bet_price)) {
//         console.log("None prices");
//         return;
//       }
//       // if (latest_market.result[0].status === 'CLOSED') {
//       //   console.log("Market closed");
//       //   break;
//       // }

//       if (current_lay_bet_price - normal_lay_price > 0.50) {
//         console.log("Abnormal Lay price");
//         // continue;
//         return ;
//       } else {
//         normal_lay_price = current_lay_bet_price;
//       }

//       if (current_lay_bet_price < previous_lay_price) {
//         const updated = update_prices(
//           current_back_bet_price,
//           current_lay_bet_price,
//           backBetPrice,
//           layBetPrice,
//           target_price,
//           sl_price,
//           sessionToken
//         );

//         target_price = updated.target_price;
//         sl_price = updated.sl_price;
//         previous_lay_price = current_lay_bet_price;
//       }
//       console.log("Target price is " , target_price);
//       console.log("sl price ", sl_price);
//       console.log("back bet placed at " , backBetPrice)
//       console.log("Selection" , selectionId);
      
//       if (current_lay_bet_price >= backBetPrice) {
//         console.log("In Above SL code");
//         sl_price = original_sl_price;
//         previous_lay_price = current_lay_bet_price;
//       }

//       console.log("back", current_back_bet_price);
//       console.log("Lay", current_lay_bet_price);

//       const status = await check_exit_conditions(
//         current_back_bet_price,
//         current_lay_bet_price,
//         target_price,
//         sl_price,
//         backStake,
//         backBetPrice,
//         selectionId,
//         marketId,
//         sessionToken
//       );
    


//       console.log("status" , status);
//       if (status.success) {
//         console.log("lay bet placed");
//         client.off("data" , getLiveOdds);
//         console.log("lay bet placed and connection shut down");
        
//         return ;
        
//       }


//     } catch (err) {
//       console.log("Error in monitoring loop", err);
//     }
  
//   });
//   //---------------------


//   client.on('end', () => {
//     console.log('Connection closed by server.');
//   });
// client.on('error', (err) => {
//   console.error('Error with SSL socket:', err);
// });


// function update_prices(current_back_bet_price, current_lay_bet_price, backBetPrice, layBetPrice, target_price, sl_price) {
//   let new_target_price = target_price;
//   let new_sl_price = sl_price;

//   if (current_lay_bet_price < backBetPrice) {
//     if (current_lay_bet_price >= (backBetPrice - 0.1)) {
//       new_sl_price = parseFloat((current_back_bet_price + 0.5).toFixed(2));
//     }
//     else if (backBetPrice > 1.5 && (backBetPrice - current_lay_bet_price) >= 0.2) {
//       new_sl_price = parseFloat((current_lay_bet_price + 0.05).toFixed(2));
//     }
//     else if (backBetPrice <= 1.5 && (backBetPrice - current_lay_bet_price) >= 0.1) {
//       new_sl_price = parseFloat((current_lay_bet_price + 0.05).toFixed(2));
//     }
//     else {
//       new_sl_price = parseFloat((current_lay_bet_price + 0.1).toFixed(2));
//     }

//     new_target_price = Math.max(parseFloat((current_back_bet_price - 0.2).toFixed(2)), 1.01);
//   }

//   return { target_price: new_target_price, sl_price: new_sl_price };
// }
 
 
// async function check_exit_conditions(current_back_bet_price, current_lay_bet_price, target_price, sl_price, backStake, backBetPrice, selectionId, marketId, sessionToken) {


 
//   if (current_lay_bet_price <= target_price || current_lay_bet_price >= sl_price) {
//     // if(true){
//     const layStake = layStakeCalculator(backStake, current_lay_bet_price, backBetPrice);

//     const betData = {
//       selectionId,
//       marketId,
//       side: 'LAY',
//       size: layStake,
//       price: current_lay_bet_price,
//     };

//     // const layResponse = await placeBettt(betData, sessionToken);
//     const layResponse = {
//       "jsonrpc": "2.0",
//       "result": {
//         "marketId": marketId,
//         "instructionReports": [
//           {
//             "instruction": {
//               "selectionId": selectionId,
//               "handicap": 0,
//               "limitOrder": {
//                 "size": layStake,
//                 "price": current_lay_bet_price,
//                 "persistenceType": "LAPSE"
//               },
//               "orderType": "LIMIT",
//               "side": "LAY"
//             },
//             "betId": "31242604945",
//             "placedDate": new Date().toISOString(),
//             "averagePriceMatched": 0,
//             "sizeMatched": 0,
//             "status": "SUCCESS"
//           }
//         ],
//         "status": "SUCCESS"
//       },
//       "id": 1
//     };

//     console.log(`LAY bet placed at ${current_lay_bet_price}`);



//     parentPort.postMessage({ success: true, layResponse: layResponse , layStake })
    
//     try {
//       const response = await axios.post('http://localhost:6060/api/Lhistory');
//       return  ({ success: true, layResponse: layResponse });
//     } catch (error) {
//       console.error('Error hitting API:', error.message);
//     }

//   }
// return ({success : false});

// }

// async function placeBettt(strategyData, sessionToken) {
//   const { selectionId, marketId, side, size, price } = strategyData;
//   const apiUrl = "https://api.betfair.com/exchange/betting/json-rpc/v1";

//   const payload = {
//     jsonrpc: '2.0',
//     method: "SportsAPING/v1.0/placeOrders",
//     params: {
//       marketId,
//       instructions: [{
//         selectionId: selectionId,
//         handicap: 0,
//         side: side,
//         orderType: "LIMIT",
//         limitOrder: {
//           size: parseFloat(size),
//           price: parseFloat(price),
//           persistenceType: "PERSIST",
//         },
//       }],
//     },
//     id: 1,
//   };

//   try {
//     const response = await axios.post(apiUrl, payload, {
//       headers: {
//         'X-Application': process.env.API_KEY,
//         'Content-Type': 'application/json',
//         'X-Authentication': sessionToken,
//       },
//     });

//     return response.data;
//   } catch (error) {
//     console.error('Error placing bet:', error.message);
//     return null;
//   }
// }}



// parentPort.on("message", async (data) => {
//   await processStrategy3(data.sessionToken, data.marketId, data.amount, data.matchData);
// });





const { parentPort } = require('worker_threads');
const axios = require('axios');
const { fetchMarketBook } = require('../marketBook');
const tls = require('tls');
 
const { setupLogger } = require('../../logger');
const { setLogger } = require('../../logger');
const logger = setLogger("Strategy_3", "logs/Betting_data.log");
 
function layStakeCalculator(backStake, layBetPrice, backBetPrice) {
  // logger.info("Hello ", backStake, layBetPrice);
 
  let layStake = (backStake * backBetPrice) / layBetPrice;
  layStake = Math.round(layStake * 100) / 100;
  return layStake;
}
 
const processStrategy3 = async (sessionToken, marketId, amount, matchData) => {
  try {
    logger.info(`Processing Strategy 3 for Market ID: ${marketId}`);
 
    var marketTimes;
    if (matchData && matchData.result && Array.isArray(matchData.result)) {
      marketTimes = matchData.result
        .filter(matchh => matchh.marketId === marketId)
        .map(matchh => {
          return matchh.marketStartTime;
        });
    } else {
      logger.error("Error: matchData.result is not available or not an array");
    }
     
    var runnername1  = null
    var runnername2 = null;
     const data =  matchData.result;
     data.map((i)=>{
       if(i.marketId == marketId){
           runnername1 = i.runners[0].runnerName;
           runnername2 = i.runners[1].runnerName;
       }
     
     })
   
   
   //logger file
     const strategyName="Strategy 3"
    const matchName = `${runnername1} VS ${runnername2}`;
    const match=setupLogger(matchName,strategyName);
 
    const marketBookData = await fetchMarketBook(sessionToken, marketId);
 
    if (!marketBookData || !marketBookData.result || marketBookData.result.length === 0) {
      throw new Error("Invalid market book data");
    }
 
    const runner1 = marketBookData.result[0].runners[0];
    const runner2 = marketBookData.result[0].runners[1];
 
    const firstBackOdds = runner1.ex.availableToBack?.[0]?.price || null;
    const firstLayOdds = runner1.ex.availableToLay?.[0]?.price || null;
    const secondBackOdds = runner2.ex.availableToBack?.[0]?.price || null;
    const secondLayOdds = runner2.ex.availableToLay?.[0]?.price || null;
    let backBetPrice, selectionId, backStake, layPrice, layBetPrice;
 
    if (!firstBackOdds || !secondBackOdds) {
      const reason = "Back odds not found";
      parentPort.postMessage({ success: false, reason });
      return;
    }
 
    if (firstBackOdds > secondBackOdds) {
      backBetPrice = secondBackOdds;
      layBetPrice = secondLayOdds;
      selectionId = runner2.selectionId;
    } else {
      backBetPrice = firstBackOdds;
      layBetPrice = firstLayOdds;
      selectionId = runner1.selectionId;
    }
 
    if (!backBetPrice) {
      logger.info("Price Not found!!!!!");
      const reason = "Price Not found!!!!!";
      parentPort.postMessage({ success: false, reason });
      return;
    }
 
    if (backBetPrice <= 1.1) {
      logger.info("Back bet is low");
      const reason = `Back bet is low ${backBetPrice}`;
      parentPort.postMessage({ success: false, reason });
      return;
    }
 
    // Fix: Use amount instead of undefined 'size' variable
    backStake = Math.round(amount / 2 * 10) / 10;
    var backResponse;
 
    // -------------------back bet try catch---------------
    try {
      const betData = {
        selectionId,
        marketId,
        side: 'BACK',
        size: backStake,
        price: backBetPrice,
      };
      logger.info(" back bet placed at  "+ backBetPrice);
 
      //  backResponse = await placeBettt(betData, sessionToken);
      backResponse = {
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
 
      var statuss = backResponse.result.status;
      if (backResponse.error) {
        logger.error("BACK bet placement failed. Stopping strategy.");
        parentPort.postMessage({ success: false, reason: "BACK bet placement failed" });
        return;
      }
      else {
        logger.info("Back Bet placed Successfully!!");
        parentPort.postMessage({ success: true, backResponse, backBetPrice , backStake });
        try {
          const response = await axios.post('http://localhost:6060/api/Bhistory');
          // logger.info(response);
 
        } catch (error) {
          logger.error('Error hitting database API:'+ error.message);
        }
      }
 
    } catch (err) {
      logger.error("Error placing back bet" + err);
      parentPort.postMessage({ success: false, error: err.message });
      return;
    }
 
    // ------------------------------Start monitoring for lay bet in background---------------
    if (statuss === "SUCCESS") {
      // Continue with lay monitoring in the background
      monitor_market(marketBookData, backBetPrice, layBetPrice, selectionId, backStake, matchData, marketId, sessionToken,match)
        .then(layResponse => {
          if (layResponse) {
            // When lay bet is complete, send another message with the lay response
            parentPort.postMessage({ success: true, layResponse });
          }
        })
        .catch(err => {
          logger.error("Error in lay monitoring: " + err);
          parentPort.postMessage({
            success: false,
            error: `Lay monitoring error: ${err.message}`,
            stage: "lay_monitoring"
          });
        });
    }
 
  } catch (err) {
    logger.error("error in whole code "+ err);
    parentPort.postMessage({ success: false, error: err.message });
  }
};
 
async function monitor_market(marketBookData, backBetPrice, layBetPrice, selectionId, backStake, matchData, marketId, sessionToken,match) {
  // "Monitor market prices and execute lay bet when conditions are met
  let previous_lay_price = layBetPrice;
  let original_sl_price = parseFloat((layBetPrice + 0.5).toFixed(2));
  let target_price = parseFloat((backBetPrice - 0.2).toFixed(2));
  let sl_price = original_sl_price;
  let normal_lay_price = layBetPrice;
 
  var options = {
    host: 'stream-api.betfair.com',
    port: 443
  }
  try {
    var client = tls.connect(options, function () {
      match.info("......Connected......");
    });
 
  } catch (err) {
    match.info("Error in connection to betfair stream api" + err);
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
 
 
 
 
//Function to get live odds from the stream-api
  const odds_data = {};
  client.on('data', async function getLiveOdds(data) {
    match.info("-----------------------------------");
    const decodedData = data.toString();
 
    if (!decodedData) {
      match.error("Not receiving data anymore from the server!!!!");
   
      client.end(); // Close the connection
      return;
    }
 
    match.info("Market Data: "+ decodedData);
 
    try {
 
      const response = JSON.parse(decodedData);
 
      if (response.op === "mcm" && response.mc) {
        for (const market of response.mc) {
          if (market.marketDefinition) {
            market_status = market.marketDefinition.status;
            match.info(`Market Status Updated: ${market_status}`);
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
                  match.info(`Back odds are not available: ${back_odds}`);
                }
              }
 
              // Safely get best lay odds, checking for null/undefined
              if (runner.batl && Array.isArray(runner.batl) && runner.batl[0]) {
                const lay_odds = runner.batl[0][1];
                if (lay_odds !== 0) {
                  odds_data[player_id].lay_odds = lay_odds;
                } else {
                  match.info(`Lay odds are not available: ${lay_odds}`);
                }
              }
            }
 
            match.info("Odds Data "+odds_data);
 
 
          }
        }
      }
 
 
 
 
      if (Object.keys(odds_data).length === 0) {
        match.error("No odds data available");
        return; // continue waiting for data
      }
     
   
      const current_lay_bet_price =  odds_data[`${selectionId}`].lay_odds || NaN;
      const current_back_bet_price = odds_data[`${selectionId}`].back_odds  || NaN;
       
      if (Number.isNaN(current_back_bet_price) || Number.isNaN(current_lay_bet_price)) {
        match.error("None prices");
        return;
      }
   
      if (current_lay_bet_price - normal_lay_price > 0.50) {
        match.info("Abnormal Lay price");
        // continue;
        return ;
      } else {
        normal_lay_price = current_lay_bet_price;
      }
 
      if (current_lay_bet_price < previous_lay_price) {
        const updated = update_prices(
          current_back_bet_price,
          current_lay_bet_price,
          backBetPrice,
          layBetPrice,
          target_price,
          sl_price,
          sessionToken
        );
 
        target_price = updated.target_price;
        sl_price = updated.sl_price;
        previous_lay_price = current_lay_bet_price;
      }
     
      if (current_lay_bet_price >= backBetPrice) {
        match.info("In Above SL code");
        sl_price = original_sl_price;
        previous_lay_price = current_lay_bet_price;
      }
 
      match.info("Current Back " + current_back_bet_price);
      match.info("Current Lay " + current_lay_bet_price);
      match.info("Target Price " + target_price);
      match.info("SL Price " + sl_price);
 
      const status = await check_exit_conditions(
        current_back_bet_price,
        current_lay_bet_price,
        target_price,
        sl_price,
        backStake,
        backBetPrice,
        selectionId,
        marketId,
        sessionToken
      );
   
 
 
      match.info("status" + status);
      if (status.success) {
        match.info("lay bet placed");
        client.off("data" , getLiveOdds);
        match.info("lay bet placed and connection shut down");
       
        return ;
       
      }
 
 
    } catch (err) {
      match.info("Error in monitoring loop" + err);
    }
 
  });
  //---------------------
 
 
  client.on('end', () => {
    match.info('Connection closed by server.');
  });
client.on('error', (err) => {
  match.error('Error with SSL socket:'+ err);
});
 
 
function update_prices(current_back_bet_price, current_lay_bet_price, backBetPrice, layBetPrice, target_price, sl_price) {
  let new_target_price = target_price;
  let new_sl_price = sl_price;
 
  if (current_lay_bet_price < backBetPrice) {
    if (current_lay_bet_price >= (backBetPrice - 0.1)) {
      new_sl_price = parseFloat((current_back_bet_price + 0.5).toFixed(2));
    }
    else if (backBetPrice > 1.5 && (backBetPrice - current_lay_bet_price) >= 0.2) {
      new_sl_price = parseFloat((current_lay_bet_price + 0.05).toFixed(2));
    }
    else if (backBetPrice <= 1.5 && (backBetPrice - current_lay_bet_price) >= 0.1) {
      new_sl_price = parseFloat((current_lay_bet_price + 0.05).toFixed(2));
    }
    else {
      new_sl_price = parseFloat((current_lay_bet_price + 0.1).toFixed(2));
    }
 
    new_target_price = Math.max(parseFloat((current_back_bet_price - 0.2).toFixed(2)), 1.01);
  }
 
  return { target_price: new_target_price, sl_price: new_sl_price };
}
 
 
async function check_exit_conditions(current_back_bet_price, current_lay_bet_price, target_price, sl_price, backStake, backBetPrice, selectionId, marketId, sessionToken,match) {
 
 
 
  if (current_lay_bet_price <= target_price) {
    // if(true){
    const layStake = layStakeCalculator(backStake, current_lay_bet_price, backBetPrice);
    match.info("Lay condition met: Placing lay bet at target price.");
    match.info("Target Price Hit Successfully!!!");
    const betData = {
      selectionId,
      marketId,
      side: 'LAY',
      size: layStake,
      price: current_lay_bet_price,
    };
 
    // const layResponse = await placeBettt(betData, sessionToken);
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
 
    match.info(`LAY bet placed at ${current_lay_bet_price}`);
 
 
 
    parentPort.postMessage({ success: true, layResponse: layResponse , layStake })
   
    try {
      const response = await axios.post('http://localhost:6060/api/Lhistory');
      return  ({ success: true, layResponse: layResponse });
    } catch (error) {
      match.error('Error hitting API: '+ error.message);
    }
 
  }
 
  if (current_lay_bet_price >=sl_price) {
    // if(true){
    const layStake = layStakeCalculator(backStake, current_lay_bet_price, backBetPrice);
    logger.info("Stop loss condition met: Placing lay bet at stop loss price.");
    match.info("SL Price Hit Successfully!!!");
    const betData = {
      selectionId,
      marketId,
      side: 'LAY',
      size: layStake,
      price: current_lay_bet_price,
    };
 
    // const layResponse = await placeBettt(betData, sessionToken);
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
 
    parentPort.postMessage({ success: true, layResponse: layResponse , layStake })
   
    try {
      const response = await axios.post('http://localhost:6060/api/Lhistory');
      return  ({ success: true, layResponse: layResponse });
    } catch (error) {
      match.error('Error hitting API:' + error.message);
    }
 
  }
return ({success : false});
 
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
    match.error('Error placing bet: ' + error.message);
    return null;
  }
}}
 
 
 
parentPort.on("message", async (data) => {
  await processStrategy3(data.sessionToken, data.marketId, data.amount, data.matchData);
});
 
 