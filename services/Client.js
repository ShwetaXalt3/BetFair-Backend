const axios = require('axios');
const getToken = require("../services/Token");
 
async function Client() {
  try {
    const apiData = await getToken();
    if (!apiData) {
      throw new Error("Authentication failed. No sessionToken received.");
    }
 
    const data= axios.create({
      headers: {
        'X-Application': process.env.API_KEY,
        'Content-Type': 'application/json',
        'X-Authentication': apiData, // Pass sessionToken here
      },
    });
    return data;
 
  } catch (error) {
    console.error("Error creating client:", error.message);
    throw error;
  }
}
 
module.exports = Client;