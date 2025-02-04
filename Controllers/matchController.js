// Tournament
const apiClient = require('../services/Client');
const axios = require('axios');
const getToken = require('../Controllers/authController');
 
const fetchMatch = async (req,res) => {
  try {
    // const token = await getToken();
    const apiData = await getToken.userLoginData();


    console.log(apiData);
    const token = apiData.sessionToken;
    const {id}=req.body;
    if(!id){
      res.send("id not found");
    }
    console.log(id)
   
    const apiUrl = process.env.API_BASE_URL || "https://api.betfair.com/exchange/betting/json-rpc/v1";
 
    console.log(apiUrl)
    // Making the API request to fetch match data
 
    const requestPayload={
          jsonrpc: "2.0",
          method: "SportsAPING/v1.0/listCompetitions",
          params: { filter: {eventTypeIds: ["2"]} },
          id:id
         }
 
 
         const response = await apiClient.post(apiUrl, requestPayload, {
          headers: {
            'X-Authentication': token,
          },
        });
       
    res.status(200).json(response.data);
    console.log(response.data);
  } catch (error) {
   
    console.error('Match Fetch Error:', error.message);
    if (error.response) {
      console.error('API Response Error:', error.response.data);
      console.error('Status Code:', error.response.status);
    }
 
    throw new Error('Failed to fetch match data');
  }
};
 
module.exports = { fetchMatch };