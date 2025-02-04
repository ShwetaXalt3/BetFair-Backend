const express = require('express');
const router = express.Router();

const authController = require('../Controllers/authController');
const eventController = require('../Controllers/eventController');
// const sportController = require('../Controllers/sportController');
const tournamentController = require('../Controllers/tournamentController');
const matchController = require('../Controllers/matchController');
const AccountFund=require("../Controllers/AccountFunds");
// const mergedDataController = require('../models/mergedDataController'); // Added for merged data

// Authentication route
// router.post('/login', authController.userLoginData); // POST for login, authentication

// Event, Sport, Tournament, and Match data routes
router.post('/event', eventController.fetchEvent); // GET to fetch event details
// router.post('/sport/:sportId', sportController.fetchSport); // GET to fetch sport details
router.post('/match', tournamentController.fetchTournament); // GET to fetch tournament details
router.post('/login',authController.userLoginData);
router.post('/tournament', matchController.fetchMatch); // GET to fetch match status
router.post('/accfunds',AccountFund.fetchFund);
 

//Merged data route - This is where the merged data is stored
//  router.post('/mergedData', mergedDataController.saveMergedData); // POST to save merged data

module.exports = router;

