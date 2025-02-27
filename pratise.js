// const WebSocket = require('ws');
// const axios = require('axios'); // To handle authentication (assuming Betfair provides API for token generation)

// const APP_KEY = 'your_app_key'; // Replace with your actual app key
// const USERNAME = 'your_username'; // Replace with your actual username
// const PASSWORD = 'your_password'; // Replace with your actual password
// const MARKET_ID = '1.125037533'; // Replace with a valid market ID

// // 1. Authenticate and get the session token (assuming an API for login)
// async function authenticate() {
//     try {
//         const response = await axios.post('https://identitysso.betfair.com/api/login', {
//             username: USERNAME,
//             password: PASSWORD,
//             appKey: APP_KEY,
//         });
//         return response.data.sessionToken; // Assuming a sessionToken is returned
//     } catch (error) {
//         console.error("Authentication failed:", error);
//         return null;
//     }
// }

// // 2. WebSocket setup for Betfair streaming
// function setupWebSocket(sessionToken) {
//     const BETFAIR_STREAM_HOST = "stream-api.betfair.com";
//     const ws = new WebSocket(`wss://${BETFAIR_STREAM_HOST}/stream`);

//     ws.on('open', () => {
//         console.log("Connected to Betfair Stream API.");

//         // Authenticate via WebSocket
//         const authMessage = {
//             op: "authentication",
//             appKey: APP_KEY,
//             session: sessionToken
//         };
//         ws.send(JSON.stringify(authMessage));
//         console.log("Sent authentication request.");
//     });

//     ws.on('message', (data) => {
//         console.log("Received Data:", data.toString('utf8'));

//         const response = JSON.parse(data);

//         if (response.op === "status" && response.statusCode === "SUCCESS") {
//             console.log("Authentication Successful!");

//             // Market Subscription
//             const marketSubscription = {
//                 op: "marketSubscription",
//                 id: 1,
//                 marketFilter: { marketIds: [MARKET_ID] },
//                 marketTypes: ["MATCH_ODDS"],
//                 marketDataFilter: {
//                     fields: ["EX_BEST_OFFERS"],
//                     ladderLevels: 1
//                 }
//             };
//             ws.send(JSON.stringify(marketSubscription));
//             console.log("Sent market subscription request.");
//         }

//         if (response.op === "marketData") {
//             // Handle market data updates here
//             console.log("Market Data Update:", response);
//         }
//     });

//     ws.on('error', (error) => {
//         console.error("WebSocket Error:", error);
//     });

//     ws.on('close', () => {
//         console.log("WebSocket connection closed.");
//     });
// }

// // 3. Main function to run the code
// async function main() {
//     const sessionToken = await authenticate();
//     if (sessionToken) {
//         setupWebSocket(sessionToken);
//     } else {
//         console.log("Failed to authenticate.");
//     }
// }

// // Run the main function
// main();


var tls = require('tls');

/*	Socket connection options */

var options = {
    host: 'stream-api.betfair.com',
    port: 443
}

/*	Establish connection to the socket */

var client = tls.connect(options, function () {
    console.log("Connected");
});

/*	Send authentication message */

client.write('{"op": "authentication", "appKey": "M90yVlWTGZfS7rEi", "session": "lTc7b+h9cyG7Zv6nJ/prdAQNwH/DBahfgR2cFnGAC70="}\r\n');


/*	Subscribe to order/market stream */
// client.write('{"op":"orderSubscription","orderFilter":{"includeOverallPosition":false,"customerStrategyRefs":["betstrategy1"],"partitionMatchedByStrategyRef":true},"segmentationEnabled":true}\r\n');
// client.write('{"op":"marketSubscription","id":2,"marketFilter":{"marketIds":["1.120684740"],"bspMarket":true,"bettingTypes":["ODDS"],"eventTypeIds":["1"],"eventIds":["27540841"],"turnInPlayEnabled":true,"marketTypes":["MATCH_ODDS"],"countryCodes":["ES"]},"marketDataFilter":{}}\r\n');
// client.write('{"op":"orderSubscription","orderFilter":{"includeOverallPosition":false,"customerStrategyRefs":["betstrategy1"],"partitionMatchedByStrategyRef":true},"segmentationEnabled":true}\r\n');
const marketSubscription = JSON.stringify({
    op: "marketSubscription",
    id: 1,
    marketFilter: { marketIds: ["1.240114784"] },
    marketTypes: ["MATCH_ODDS"],
    marketDataFilter: { fields: ["EX_BEST_OFFERS"], ladderLevels: 1 }
  });
  
  client.write(marketSubscription + "\r\n");
const odds_data = {};
  client.on('data', (data) => {
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
        return; // continue waiting for data
      }
    } catch (err) {
      console.error('Error processing market data:', err);
    }
  });
  
  client.on('end', () => {
    console.log('Connection closed by server.');
  });
  
  client.on('error', (err) => {
    console.error('Error with SSL socket:', err);
  });
