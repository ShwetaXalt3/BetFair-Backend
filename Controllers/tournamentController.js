const axios = require('axios')
const  AllData  = require('../services/AllData');
 
const fetchTournament = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(400).json({ message: 'Missing or invalid authorization header' });
    }
   
    const sessionToken = authHeader.split(' ')[1];


    const id = req.body.id;
 
   
    if(!id){
      res.send("id not found");
    }
    const apiUrl = process.env.API_BASE_URL || "https://api.betfair.com/exchange/betting/json-rpc/v1";
    // Making the API request to fetch match data

    const targetDate = new Date();
    
    const marketStartTime = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate(), 0, 0, 0));
    const formattedMarketStartTime = marketStartTime.toISOString().split('.')[0] + "Z";
   
 
    const marketEndTime = new Date(marketStartTime);
    marketEndTime.setUTCDate(marketEndTime.getUTCDate() + 1); // Move to next day
    const formattedMarketEndTime = marketEndTime.toISOString().split('.')[0] + "Z";
    
 
    const requestPayload={
          jsonrpc: "2.0",
          method: "SportsAPING/v1.0/listCompetitions",
          params: {
             filter:{
             eventTypeIds: [id],
             marketStartTime : {from : marketStartTime, to: marketEndTime},

             },
             maxResults:100,

             },
          id:id
         }
         const response = await axios.post(apiUrl, requestPayload, {
          headers: {
            'X-Application': process.env.API_KEY,    
            'Content-Type': 'application/json',    
            'X-Authentication': sessionToken,      
          }
        });
    // console.log(response.data);
    
    const tournamentDatas = response.data.result;

     if (Array.isArray(tournamentDatas)) {
  const tournamentNames = tournamentDatas.map(tournament => tournament.competition?.name).filter(Boolean);

 
  // res.status(200).json({ tournaments: tournamentNames });
  res.status(200).json(response.data)

  AllData.tournament(response.data);

  return response.data;
} 

    // const tournamentData = response.data;
    // AllData.tournament(tournamentData);
    // return tournamentData;
 
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