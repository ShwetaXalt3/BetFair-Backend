const createClient = require('../services/Client');
 
const matchData={
    match: function (match) {
    //  console.log(match);
      return matchData;  
    },
}
 
const fetchProbability = async (req,res)=>{
 
    try{
 
        const apiClient = await createClient();
        const apiUrl = process.env.API_BASE_URL || "https://api.betfair.com/exchange/betting/json-rpc/v1";
 
        const {amount, strategies} = req.body;
        console.log(amount , strategies);
 
        // python api for probability and strategies
 
         
        const matchdata=matchData.match;  
        console.log(matchdata);
 
        const requestPayload = {
            data:{
                marketCatalogue:[
                    {
                        amount : amount,
                        matchdata,
                        strategies : strategies
                    }
                ]
            }
          }
       const response = await apiClient.post(apiUrl,requestPayload);
 
       return res.status(200).json(response.data);
   
    }
    catch(err){
        console.log(err);
       
    }
}
module.exports = {fetchProbability};