const axios = require('axios');
 
const getToken = require('../Controllers/authController');
 
const fetchFund=async(req,res)=>{
    try{
         const apiData = await getToken.userLoginData();
         const token = apiData.sessionToken;
         const apiUrl = process.env.API_FUND_URL;
 
            const requestPayload = {
                //  jsonrpc: "2.0",
                 method: "AccountAPING/v1.0/getAccountFunds",
               };
           
               // Make the request with the correct structure
               const response = await axios.post(apiUrl, requestPayload, {
                 headers: {
                   "X-Application": "M90yVlWTGZfS7rEi", // Ensure this is correct
                   "X-Authentication": token, // Fixed header name
                   "Content-Type": "application/json"
                 }
               });
           
               // Send successful response
               res.status(200).json(response.data);
               console.log(response.data);
    }
    catch(err){
        console.error('Error fetching Funds data:', err.message);
    }
}
module.exports={fetchFund};