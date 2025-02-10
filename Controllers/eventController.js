const  AllData  = require('../services/AllData');
const axios = require('axios');
 
const fetchEvent = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
 
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(400).json({ message: 'Missing or invalid authorization header' });
    }
 
    const sessionToken = authHeader.split(' ')[1];

    const apiUrl = process.env.API_BASE_URL || "https://api.betfair.com/exchange/betting/json-rpc/v1";
 
    const requestPayload = {
      jsonrpc: '2.0',
      method: 'SportsAPING/v1.0/listEventTypes',
      params: { filter: {} },
    };
     
    const response = await axios.post(apiUrl, requestPayload, {
      headers: {
        'X-Application': process.env.API_KEY,    
        'Content-Type': 'application/json',    
        'X-Authentication': sessionToken,      
      }
    });
    
    if(!response || !response.data){
      throw new Error("Invalid response the api")
    }
        const eventData = response.data ;
        AllData.event(eventData)

      const validIds = ["2","6423", "7522", "61420","998917", "6422", "26420387"]
      const mapping = response.data.result;
      const validEventTypes = [];
      mapping.forEach((i)=>{
        if(validIds.includes(i.eventType.id)){
          validEventTypes.push(i.eventType);
        }
      })
      if(validEventTypes.length > 0){
        res.status(200).json(validEventTypes);
      }
      else{
        res.status(404).json({message : "No valid event type found"})
      }
      return eventData;
      
  } catch (error) {
    console.error('Error fetching event data:', error.message);
    if (error.response) {
      console.error('API Response Error:', error.response.data);
    }
    res.status(error.response?.status || 500).json({
      message: 'Failed to fetch event data',
      error: error.response?.data || error.message,
    });
  }
};


 
module.exports = { fetchEvent };