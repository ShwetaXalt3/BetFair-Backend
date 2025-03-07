// const express = require('express');
// const router = express.Router();
// const probability = require('../Controllers/Probability')
// const authController = require('../Controllers/authController');
// const eventController = require('../Controllers/eventController');
// const tournamentController = require('../Controllers/tournamentController');
// const matchController = require('../Controllers/matchController');
// const AccountFund=require("../Controllers/AccountFunds");
// const  { processAndStoreData }  = require('../services/dataService');
// const  placeOrder  = require('../Controllers/placeOrder');
// const marketBook = require('../Controllers/marketBook')

// // Authentication route
// // router.post('/login', authController.userLoginData); // POST for login, authentication

// // Event, Sport, Tournament, and Match data routes
// router.post('/event', eventController.fetchEvent); // GET to fetch event details
// // router.post('/sport/:sportId', sportController.fetchSport); // GET to fetch sport details
// router.post('/tournament', tournamentController.fetchTournament); // GET to fetch tournament details
// router.post('/login',authController.userLoginData);
// router.post('/match', matchController.fetchMatch); // GET to fetch match status
// router.post('/accfunds',AccountFund.fetchFund);
// // router.post('/dataService' , dataService.processAndStoreData);
// router.post('/probability', probability.fetchProbability );
// router.post('/placeOrder' , placeOrder.placeOrders);
// router.post('/marketbook', marketBook.fetchMarketBook) 
 

// //Merged data route - This is where the merged data is stored
// //  router.post('/history', dataService.processAndStoreData); // POST to save merged data

// module.exports = router;

const express = require('express');
const router = express.Router();
const probability = require('../Controllers/Probability')
const authController = require('../Controllers/authController');
const eventController = require('../Controllers/eventController');
const tournamentController = require('../Controllers/tournamentController');
const matchController = require('../Controllers/matchController');
const AccountFund=require("../Controllers/AccountFunds");
//  const dataService = require('../services/dataService');

const  placeOrder  = require('../Controllers/placeOrder');
const marketBook = require('../Controllers/marketBookApi');
const profit=require('../Controllers/Profit');
const getMergeData=require('../services/getMergeServices');
// const dataServiceL = require('../services/dataServiceL')
const { processAndStoreData: processLayData, completeBet } = require('../services/dataServiceL');

 
// Authentication route
// router.post('/login', authController.userLoginData); // POST for login, authentication
 
// Event, Sport, Tournament, and Match data routes
router.post('/event', eventController.fetchEvent); // GET to fetch event details
// router.post('/sport/:sportId', sportController.fetchSport); // GET to fetch sport details
router.post('/tournament', tournamentController.fetchTournament); // GET to fetch tournament details
router.post('/login',authController.userLoginData);
router.post('/match', matchController.fetchMatch); // GET to fetch match status
router.post('/accfunds',AccountFund.fetchFund);
router.post('/profit' , profit.fetchProfit);
router.post('/probability', probability.fetchProbability );
router.post('/placeOrder' , placeOrder.placeOrders);
router.post('/marketbook', marketBook.fetchMarketBook);
router.get('/gethistory',getMergeData.getMergedData);
 
 
//Merged data route - This is where the merged data is stored
 
// router.post('/Bhistory',dataService.processAndStoreData); 
router.post('/Lhistory',processLayData);
router.post('/completeBet', completeBet);


 
module.exports = router;
