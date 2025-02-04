const axios = require('axios');
 
const Client = axios.create(
    {
  baseURL: process.env.API_BASE_URL,
  headers: {
    'X-Application': process.env.API_KEY,
    'Content-Type': 'application/json',
  },
});
 
module.exports = Client;