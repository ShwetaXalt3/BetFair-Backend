const { parentPort } = require('worker_threads');
const axios = require('axios');
const { fetchMarketBook } = require('../marketBook');

function layStakeCalculator(backStake, layBetPrice, backBetPrice) {
  // console.log("Hello ", backStake, layBetPrice);

  let layStake = (backStake * backBetPrice) / layBetPrice;
  layStake = Math.round(layStake * 100) / 100;
  return layStake;
}

const processStrategy3 = async (sessionToken, marketId, amount, matchData) => {
  try {
    console.log(`Processing Strategy 3 for Market ID: ${marketId}`);

    var marketTimes;
    if (matchData && matchData.result && Array.isArray(matchData.result)) {
      marketTimes = matchData.result
        .filter(matchh => matchh.marketId === marketId)
        .map(matchh => {
          return matchh.marketStartTime;
        });
    } else {
      console.log("Error: matchData.result is not available or not an array");
    }

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
      console.log("Price Not found!!!!!");
      const reason = "Price Not found!!!!!";
      parentPort.postMessage({ success: false, reason });
      return;
    }
    
    if (backBetPrice <= 1.1) {
      console.log("Back bet is low");
      const reason = "Back bet is low";
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
      console.log(" back bet placed at  ", backBetPrice);

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
        console.error("BACK bet placement failed. Stopping strategy.");
        parentPort.postMessage({ success: false, reason: "BACK bet placement failed" });
        return;
      }
      else {
        console.log("Back Bet placed Successfully!!");
       parentPort.postMessage({ success: true, backResponse, backBetPrice});
       try {
        const response = await axios.post('http://localhost:7000/api/Bhistory');
      } catch (error) {
        console.error('Error hitting API:', error);
      }
      }

    } catch (err) {
      console.error("Error placing back bet", err);
      parentPort.postMessage({ success: false, error: err.message });
      return;
    }

    // ------------------------------Start monitoring for lay bet in background---------------
    if (statuss === "SUCCESS") {
      // Continue with lay monitoring in the background
      monitor_market(marketBookData, backBetPrice, layBetPrice, selectionId, backStake, matchData, marketId, sessionToken)
        .then(layResponse => {
          if (layResponse) {
            // When lay bet is complete, send another message with the lay response
            parentPort.postMessage({ success: true, layResponse });
          }
        })
        .catch(err => {
          console.log("Error in lay monitoring:", err);
          parentPort.postMessage({ 
            success: false, 
            error: `Lay monitoring error: ${err.message}`,
            stage: "lay_monitoring" 
          });
        });
    }

  } catch (err) {
    console.log("error in whole code", err);
    parentPort.postMessage({ success: false, error: err.message });
  }
};

async function monitor_market(marketBookData, backBetPrice, layBetPrice, selectionId, backStake, matchData, marketId, sessionToken) {
  // "Monitor market prices and execute lay bet when conditions are met
  let previous_lay_price = layBetPrice;
  const original_sl_price = parseFloat((layBetPrice + 0.5).toFixed(2));
  let target_price = parseFloat((backBetPrice - 0.2).toFixed(2));
  let sl_price = original_sl_price;
  let normal_lay_price = layBetPrice;

 

  while (true) {
    try {
      console.log("\n");
      console.log("Fetching Market Book again for LAY conditions...");
      const latest_market = await fetchMarketBook(sessionToken, marketId);
      
      if (!latest_market || !latest_market.result || latest_market.result.length === 0) {
        console.log("Market no longer available");
        return null;
      }
      
      const updatedRunner = latest_market.result[0].runners.find(r => r.selectionId === selectionId);
      
      if (!updatedRunner) {
        console.log("Runner no longer available");
        return null;
      }
      
      const current_lay_bet_price = updatedRunner.ex.availableToLay?.[0]?.price || NaN;
      const current_back_bet_price = updatedRunner.ex.availableToBack?.[0]?.price || NaN;

      if (latest_market.result[0].status === 'CLOSED') {
        console.log("Market closed");
        break;
      }

      if (current_lay_bet_price - normal_lay_price > 0.50) {
        console.log("Abnormal Lay price");
        continue;
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
        console.log("In Above SL code");
        sl_price = original_sl_price;
        previous_lay_price = current_lay_bet_price;
      }

      console.log("back", current_back_bet_price);
      console.log("Lay", current_lay_bet_price);

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

      // console.log("status" , status);
      if(status){
        console.log("bet placed");
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 30000));
     

    } catch (err) {
      console.log("Error in monitoring loop", err);
    }
  }
  
}

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

async function check_exit_conditions(current_back_bet_price, current_lay_bet_price, target_price, sl_price, backStake, backBetPrice, selectionId, marketId, sessionToken) {
  if (current_lay_bet_price <= target_price || current_lay_bet_price >= sl_price) {
  // if(true){
    const layStake = layStakeCalculator(backStake, current_lay_bet_price, backBetPrice);
    
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

    console.log(`LAY bet placed at ${current_lay_bet_price}`);
 
  

      parentPort.postMessage({success:true , layResponse})
      try {
        const response = await axios.post('http://localhost:7000/api/Lhistory');
        return { success: true, layResponse };
      } catch (error) {
        console.error('Error hitting API:', error.message);
      }
    
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

parentPort.on("message", async (data) => {
  await processStrategy3(data.sessionToken, data.marketId, data.amount, data.matchData);
});