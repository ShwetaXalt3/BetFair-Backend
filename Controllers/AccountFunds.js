
const axios = require('axios')

const AllData = require('../services/AllData')
const fetchFund = async (req, res) => {
  try {

    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(400).json({ message: 'Missing or invalid authorization header' });
    }

    const sessionToken = authHeader.split(' ')[1];

    const apiUrl = process.env.API_FUND_URL;

    const requestPayload = {
      method: "AccountAPING/v1.0/getAccountFunds",

    };

    // Make the request with the correct structure
    const response = await axios.post(apiUrl, requestPayload, {
      headers: {
        'X-Application': process.env.API_KEY,
        'Content-Type': 'application/json',
        'X-Authentication': sessionToken,
      }
    });
    AllData.funds(response.data);
    // Send successful response
    if (response.data.result.availableToBetBalance) {
      res.status(200).json({ "Amount": response.data.result.availableToBetBalance });

    }
  }
  catch (err) {
    console.error('Error fetching Funds data:', err.message);
  }
}
module.exports = { fetchFund };
