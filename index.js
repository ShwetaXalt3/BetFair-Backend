// Load environment variables from the .env file
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors')
const apiRoutes = require('./routes/apiRoutes');
const connectDB = require('./config/db'); // Assuming your database connection logic is in ./config/db.js
const path = require('path')

const app = express();
app.use(cors());
const PORT = 6060

// Middleware to parse JSON requests
app.use(express.json());

app.use(express.static(path.join(__dirname, '../Frontend')));
 
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/login/login.html'));
});
 
app.get('/match', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/match/matchui.html'));
});
 
// Route for the home page (if you have one)
app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/dashboard/index.html'));
});
 
app.get('/market', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/market/marketui.html'));
});
 
app.get('/history', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/history/historyui.html'));
});
// Add more routes for other pages as needed
 
// Default route
app.get('/', (req, res) => {
 
  res.redirect('/home');
});



// Connect to MongoDB using the connectDB function
connectDB(); // Assuming your `connectDB` function handles the connection logic

// Use API routes (defined in ./routes/apiRoutes.js)
app.use('/api', apiRoutes);

// Start the server and listen on port 3000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
