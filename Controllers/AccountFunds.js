const createClient = require('../services/Client');
const getToken = require('../Controllers/authController');
 const AllData = require('../services/AllData')
const fetchFund=async(req,res)=>{
    try{
         const apiData = await getToken.userLoginData();
          if (!apiData || !apiData.sessionToken) {
             return res.status(401).json({ message: 'Authentication failed. No sessionToken received.' });
          }
          const apiClient = await createClient(apiData.sessionToken);
          const apiUrl = process.env.API_FUND_URL;
 
            const requestPayload = {
                 method: "AccountAPING/v1.0/getAccountFunds",
               };
           
               // Make the request with the correct structure
               const response = await apiClient.post(apiUrl, requestPayload);
                 AllData.funds(response.data);
               // Send successful response
               res.status(200).json(response.data);
    }
    catch(err){
        console.error('Error fetching Funds data:', err.message);
    }
}
module.exports={fetchFund};
 