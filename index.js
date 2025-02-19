// Load environment variables from the .env file
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors')
const apiRoutes = require('./routes/apiRoutes');
const connectDB = require('./config/db'); // Assuming your database connection logic is in ./config/db.js

const app = express();
app.use(cors());
const PORT = 5055

// Middleware to parse JSON requests
app.use(express.json());



// Connect to MongoDB using the connectDB function
connectDB(); // Assuming your `connectDB` function handles the connection logic

// Use API routes (defined in ./routes/apiRoutes.js)
app.use('/api', apiRoutes);

// Start the server and listen on port 3000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
