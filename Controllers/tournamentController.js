const getToken = require('../Controllers/authController'); // Import TokenService
const createClient = require('../services/Client');
const  AllData  = require('../services/AllData');
 
const fetchTournament = async (req, res) => {
  try {
    const apiData = await getToken.userLoginData();
    if (!apiData || !apiData.sessionToken) {
      return res.status(401).json({ message: 'Authentication failed. No sessionToken received.' });
    }
   
    const apiClient = await createClient(apiData.sessionToken);
    const id = req.body?.id ?? "2";
 
   
    if(!id){
      res.send("id not found");
    }
    const apiUrl = process.env.API_BASE_URL || "https://api.betfair.com/exchange/betting/json-rpc/v1";
    // Making the API request to fetch match data
 
    const requestPayload={
          jsonrpc: "2.0",
          method: "SportsAPING/v1.0/listCompetitions",
          params: { filter: {eventTypeIds: [id]} },
          id:id
         }
    const response = await apiClient.post(apiUrl, requestPayload);
 
    res.status(200).json(response.data);
    const tournamentData = response.data;
    AllData.tournament(tournamentData);
    return tournamentData;
 
  } catch (error) {
   
    console.error('Match Fetch Error:', error.message);
    if (error.response) {
      console.error('API Response Error:', error.response.data);
      console.error('Status Code:', error.response.status);
    }
 
    throw new Error('Failed to fetch tournament data');
  }
};
 
module.exports = { fetchTournament };