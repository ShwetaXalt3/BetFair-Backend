const { parentPort } = require('worker_threads');
const axios = require('axios');
const { fetchMarketBook } = require('../marketBook');
const tls = require('tls');

const {setupLogger} = require('../../logger')
const {setLogger} = require('../../logger');
const logger = setLogger("Strategy_3" , "logs/Betting_data.log");
 
function layStakeCalculator(backStake, layBetPrice, backBetPrice) {
  let layStake = (backStake * backBetPrice) / layBetPrice;
  layStake = Math.round(layStake * 100) / 100;
  logger.info("Lay stack calclulator"+ layStake);
  return layStake;
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
 
async function backResponsefn(marketId, selectionId){
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
          "placedDate": new Date().toISOString(),
          "status": "SUCCESS"
        }
      ],
      "status": "SUCCESS"
    },
    "id": 1
  };
  return backResponse;
 
     
}
async function layResponsefn(marketId, selectionId, layStake, current_lay_bet_price){
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
  return layResponse;
 
}
 
// Fixed function to fetch live odds with proper marketId handling
async function fetchLiveOdds(sessionToken, marketId) {
  return new Promise((resolve, reject) => {
    const options = {
      host: 'stream-api.betfair.com',
      port: 443
    };
   
    let odds_data = {};
    let market_status = null;
   
    try {
      const client = tls.connect(options, function() {
        logger.info("TLS connected to Betfair stream API");
       
        // Authentication message
        const authMessage = JSON.stringify({
          "op": "authentication",
          "appKey": process.env.API_KEY || "M90yVlWTGZfS7rEi",
          "session": sessionToken
        });
       
        client.write(authMessage + "\r\n");
       
        // Market subscription message
        const marketSubscription = JSON.stringify({
          op: "marketSubscription",
          id: 1,
          marketFilter: { marketIds: [marketId] },
          marketDataFilter: { fields: ["EX_BEST_OFFERS"], 
            ladderLevels: 1 }
        });
       
        client.write(marketSubscription + "\r\n");
      });
     
      // Set timeout
      const timeout = setTimeout(() => {
        client.end();
        reject(new Error("Timeout waiting for odds data"));
      }, 15000);
     
      client.on('data', (data) => {

        logger.info('--------------------------------------')
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
         
          // Handle connection status message
          if (marketData.op === "connection" && marketData.connectionId) {
            logger.info("Connected to stream with ID: " + marketData.connectionId);
            return; // Wait for actual market data
          }
         
          // Handle authentication response
          if (marketData.op === "status" && marketData.connectionClosed) {
            reject(new Error("Connection closed by Betfair: " + marketData.errorMessage));
            client.end();
            return;
          }
         
          // Process market data
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
               
                // logger.info("Processed odds data: "+  odds_data);
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
      logger.error("Error setting up TLS connection:", err);
      reject(err);
    }
  });
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



    //---------------Matchdata runners name ----------------

    var runnername1  = null
    var runnername2 = null;
     const data =  matchData.result;
     data.map((i)=>{
       if(i.marketId == marketId){
           runnername1 = i.runners[0].runnerName;
           runnername2 = i.runners[1].runnerName;
       }
     })

  //Logger file
    const strategyName = "Strategy 3";
    const matchName = `${runnername1} VS ${runnername2}`;
    const match=setupLogger(matchName,strategyName);

 
    const marketBookData = await fetchMarketBook(sessionToken, marketId);
   
    if (!marketBookData || !marketBookData.result || marketBookData.result.length === 0) {
      throw new Error("Invalid market book data");
    }
 
    const runner1 = marketBookData.result[0].runners[0];
    const runner2 = marketBookData.result[0].runners[1];
    
    // Store player names if available
    const player1Name = runner1.runnerName || `Player ID ${runner1.selectionId}`;
    const player2Name = runner2.runnerName || `Player ID ${runner2.selectionId}`;
 
    const firstBackOdds = runner1.ex.availableToBack?.[0]?.price || null;
    const firstLayOdds = runner1.ex.availableToLay?.[0]?.price || null;
    const secondBackOdds = runner2.ex.availableToBack?.[0]?.price || null;
    const secondLayOdds = runner2.ex.availableToLay?.[0]?.price || null;
    let backBetPrice, selectionId, backStake, layPrice, layBetPrice;
    let selectedPlayerName;
 
    if (!firstBackOdds || !secondBackOdds) {
      const reason = "Back odds not found";
      parentPort.postMessage({ success: false, reason });
      return;
    }
 
    if (firstBackOdds > secondBackOdds) {
      backBetPrice = secondBackOdds;
      layBetPrice = secondLayOdds;
      selectionId = runner2.selectionId;
      selectedPlayerName = player2Name;
    } else {
      backBetPrice = firstBackOdds;
      layBetPrice = firstLayOdds;
      selectionId = runner1.selectionId;
      selectedPlayerName = player1Name;
    }
   
    if (!backBetPrice) {
      logger.info("Price Not found!!!!!");
      const reason = "Price Not found!!!!!";
      parentPort.postMessage({ success: false, reason });
      return;
    }
   
    if (backBetPrice <= 1.1) {
      logger.info("Back bet is low");
      const reason = "Back bet is low";
      parentPort.postMessage({ success: false, reason });
      return;
    }
 
    backStake = Math.round(amount / 2 * 10) / 10;
    
    const betTrackingData = {
      marketId: marketId,
      strategyName: strategyName,
      sportsName: "Tennis",
      playerName: selectedPlayerName,
      selectionId: selectionId,
      backStake: backStake,
      backPrice: backBetPrice,
      timestamp: new Date().toISOString()
    };
    
    // logger.info("Bet tracking data: " + betTrackingData);
   
    var backResponse;
    var statuss;
 
    // -------------------back bet try catch---------------
    try {
      const betData = {
        selectionId,
        marketId,
        side: 'BACK',
        size: backStake,
        price: backBetPrice,
      };  
      
      // Uncomment for real implementation
      // backResponse = await placeBettt(betData, sessionToken);
      backResponse = await backResponsefn(marketId, selectionId);
   
      statuss = backResponse.result.status;
     
      if (backResponse.error) {
        logger.error("BACK bet placement failed. Stopping strategy.");
        parentPort.postMessage({ success: false, reason: "BACK bet placement failed" });
        return;
      }
      else {
        logger.info("Back Bet placed Successfully!!");
        logger.info(" back bet placed at  " + backBetPrice);

        
        // Update tracking data with back bet result
        betTrackingData.backBetId = backResponse.result.instructionReports[0].betId;
        betTrackingData.backStatus = statuss;
       
        parentPort.postMessage({
          success: true,
          backResponse,
          backBetPrice,
          backStake,
          trackingData: betTrackingData
        });
        
      }
    } catch (err) {
      logger.error("Error placing back bet " + err);
      parentPort.postMessage({ success: false, error: err.message });
      return;
    }
 
    // -----Start monitoring for lay bet in background---------------
    
    if (statuss === "SUCCESS") {
      try {
        // Properly await the lay 
        
        const layResponse = await monitor_market(
          marketBookData,
          backBetPrice,
          layBetPrice,
          selectionId,
          backStake,
          matchData,
          marketId,
          sessionToken,
          betTrackingData,
          match
        );
         console.log("Layresponse from process Strategy++" , layResponse);
        
       

       
        if (layResponse && layResponse.success) {
          // Update tracking data with lay information
          betTrackingData.layStake = layResponse.layStake;
          betTrackingData.layPrice = layResponse.layPrice;
          betTrackingData.layBetId = layResponse.layResponse.result.instructionReports[0].betId;
          betTrackingData.layStatus = layResponse.layResponse.result.status;
          betTrackingData.completed = true;
          betTrackingData.completedAt = new Date().toISOString();
          
          parentPort.postMessage({
            success: true,
            layResponse: layResponse.layResponse,
            layStake: layResponse.layStake,
            trackingData: betTrackingData
          });
          return;
        }
      } catch (err) {
        logger.error("Error in lay monitoring:" + err);
        parentPort.postMessage({
          success: false,
          error: `Lay monitoring error: ${err.message}`,
          stage: "lay_monitoring",
          trackingData: betTrackingData
        });
        return ;
      }
    }
  } catch (err) {
    logger.error("error in whole code " + err);
    parentPort.postMessage({ success: false, error: err.message });
  }
};
 
async function monitor_market(marketBookData, backBetPrice, layBetPrice, selectionId, backStake, matchData, marketId, sessionToken, trackingData , match) {
  let previous_lay_price = layBetPrice;
  const original_sl_price = parseFloat((layBetPrice + 0.5).toFixed(2));
  let target_price = parseFloat((backBetPrice - 0.2).toFixed(2));
  let sl_price = original_sl_price;
  let normal_lay_price = layBetPrice;
 
  match.info("Starting market monitoring with initial values:");
  match.info(`Back Bet Price: ${backBetPrice}`);
  match.info(`Initial Lay Price: ${layBetPrice}`);
  match.info(`Target Price: ${target_price}`);
  match.info(`Stop Loss Price: ${sl_price}`);
  
  // Update tracking data with monitoring parameters
  trackingData.monitoringStarted = new Date().toISOString();
  trackingData.initialTargetPrice = target_price;
  trackingData.initialStopLossPrice = sl_price;
 
  try {
    // Initial check of market data
    let streamResponse = await fetchLiveOdds(sessionToken, marketId);
    let odds_data = streamResponse.odds_data;
    let market_status = streamResponse.market_status;
   
    // match.info("Initial stream data: " + odds_data);
   
    // Loop for monitoring market conditions
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
       
        // Get current prices for this selection
        const current_back_bet_price = odds_data[`${selectionId}`]?.back_odds;
        const current_lay_bet_price = odds_data[`${selectionId}`]?.lay_odds;
       match.info("--------------------------")
        match.info(`Monitoring check #${checkCount}:`);
        match.info(`Current back: ${current_back_bet_price}`);
        match.info(`Current lay: ${current_lay_bet_price}`);
        match.info(`target price: ${target_price}`);
        match.info(`stop loss price: ${sl_price}`);
        
        // Update tracking with latest prices
        trackingData.currentBackPrice = current_back_bet_price;
        trackingData.currentLayPrice = current_lay_bet_price;
        trackingData.currentTargetPrice = target_price;
        trackingData.currentStopLossPrice = sl_price;
       
        if (!current_back_bet_price || !current_lay_bet_price) {
          match.info("No prices available for this selection. Waiting...");
          await new Promise(resolve => setTimeout(resolve, 30000));
          continue;
        }
       
        // Check for abnormal price changes
        if (current_lay_bet_price - normal_lay_price > 0.50) {
          match.info("Abnormal lay price detected. Skipping this check.");
          await new Promise(resolve => setTimeout(resolve, 30000));
          continue;
        } else {
          normal_lay_price = current_lay_bet_price;
        }
       
        // Update prices if lay price has improved
        if (current_lay_bet_price < previous_lay_price) {
          const updated = update_prices(
            current_back_bet_price,
            current_lay_bet_price,
            backBetPrice,
            layBetPrice,
            target_price,
            sl_price
          );
          console.log("Monitor market updated ---" , updated);
         
          target_price = updated.target_price;
          sl_price = updated.sl_price;
          previous_lay_price = current_lay_bet_price;
         
          match.info("Prices updated:");
          match.info(`New target price: ${target_price}`);
          match.info(`New stop loss price: ${sl_price}`);
          
          // Update tracking data with new prices
          trackingData.currentTargetPrice = target_price;
          trackingData.currentStopLossPrice = sl_price;
        }
       
        // Reset stop loss if lay price goes above back price
        if (current_lay_bet_price >= backBetPrice) {
          match.info("Lay price above back price. Resetting stop loss.");
          sl_price = original_sl_price;
          previous_lay_price = current_lay_bet_price;
          trackingData.currentStopLossPrice = sl_price;
        }
       
        // Check exit conditions
        const exit_status = await check_exit_conditions(
          current_back_bet_price,
          current_lay_bet_price,
          target_price,
          sl_price,
          backStake,
          backBetPrice,
          selectionId,
          marketId,
          sessionToken,
          trackingData,
          match
        );       
        if (exit_status && exit_status.success) {
          match.info("Exit condition met. Lay bet placed.");
          monitoring = false;
          return exit_status;
        }
       
        // Wait before next check
        await new Promise(resolve => setTimeout(resolve, 1000));
       
      } catch (error) {
        match.error("Error during market monitoring iteration: " + error);
        trackingData.monitoringError = error.message;
        // Continue monitoring despite errors
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }
   
    match.info("Market monitoring completed without placing lay bet.");
    trackingData.monitoringCompleted = true;
    trackingData.monitoringCompletedAt = new Date().toISOString();
    trackingData.monitoringResult = "No lay bet placed";
    
    return { success: false, reason: "Monitoring period ended without conditions being met", trackingData };
   
  } catch (error) {
    match.error("Fatal error in market monitoring: " + error);
    trackingData.monitoringError = error.message;
    throw error;
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
 
async function check_exit_conditions(
  current_back_bet_price,
  current_lay_bet_price,
  target_price,
  sl_price,
  backStake,
  backBetPrice,
  selectionId,
  marketId,
  sessionToken,
  trackingData,
  match
) {
  let exitReason = null;
  
   if (current_lay_bet_price <= target_price) {
  // if(true){
    exitReason = "Target price reached";
    const layStake = layStakeCalculator(backStake, current_lay_bet_price, backBetPrice);
    match.info("Lay condition met: Placing lay bet at target price.");
    match.info(`Target price ${target_price} hit successfully with ${current_lay_bet_price}`);
   
    const betData = {
      selectionId,
      marketId,
      side: "LAY",
      size: layStake,
      price: current_lay_bet_price,
    };
 
    //  const layResponse = await placeBettt(betData, sessionToken);
   const layResponse = await layResponsefn(marketId, selectionId, layStake, current_lay_bet_price);
 
    match.info(`LAY bet placed at ${current_lay_bet_price}`);
    
    // Update tracking data with lay bet details
    trackingData.layPrice = current_lay_bet_price;
    trackingData.layStake = layStake;
    trackingData.exitReason = exitReason;
    trackingData.exitConditionMet = true;
    trackingData.exitTime = new Date().toISOString();
    
    // parentPort.postMessage({
    //   success: true, 
    //   layResponse, 
    //   layStake,
    //   layPrice: current_lay_bet_price,
    //   exitReason,
    //   trackingData,
    //   marketId,
    //   selectionId,
    //   backBetPrice,
    //   backStake
    // });
    
    
   
 
    return { 
      success: true, 
      layResponse, 
      layStake,
      layPrice: current_lay_bet_price,
      exitReason,
      marketId,
      selectionId
    };
  }
  else if (current_lay_bet_price >= sl_price) {
    exitReason = "Stop loss triggered";
    const layStake = layStakeCalculator(backStake, current_lay_bet_price, backBetPrice);
    match.info("Stop loss condition met: Placing lay bet at stop loss price.");
    match.info(`SL Price ${sl_price} Hit with ${current_lay_bet_price}`);
   
    const betData = {
      selectionId,
      marketId,
      side: "LAY",
      size: layStake,
      price: current_lay_bet_price,
    };
 
    // Uncomment for real implementation
    //  const layResponse = await placeBettt(betData, sessionToken);
    const layResponse = await layResponsefn(marketId, selectionId, layStake, current_lay_bet_price);
 

    match.info(`LAY bet placed at ${current_lay_bet_price}`);
    
    // Update tracking data with lay bet details
    trackingData.layPrice = current_lay_bet_price;
    trackingData.layStake = layStake;
    trackingData.exitReason = exitReason;
    trackingData.exitConditionMet = true;
    trackingData.exitTime = new Date().toISOString();
    
    // parentPort.postMessage({
    //   success: true, 
    //   layResponse, 
    //   layStake,
    //   layPrice: current_lay_bet_price,
    //   exitReason,
    //   trackingData,
    //   marketId,
    //   selectionId
    // });
    
    return { 
      success: true, 
      layResponse, 
      layStake,
      layPrice: current_lay_bet_price,
      exitReason,
      marketId,
      selectionId
    };
  }
 
  return { success: false };
}
  

parentPort.on("message", async (data) => {
  await processStrategy3(data.sessionToken, data.marketId, data.amount, data.matchData);
});