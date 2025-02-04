const axios = require('axios');
const { getToken } = require('../services/TokenService');

const fetchAccountDetails=async(req,res)=>{
    try{
        const token = await getToken();
       
           const response = await axios.post(
             `${process.env.API_FUND_URL}/fund`, 
             {},
             {
                headers: { Authorization: `Bearer ${token}` }, 
                payload:{
                 jsonrpc: '2.0',
                 method:"AccountAPING/v1.0/getAccountDetails"
                 }
             },
           );
           res.status(200).json(response.data);
    }
    catch(err){
        console.error('Error fetching AccountDetails data:', err.message);
    }
}
module.exports={fetchAccountDetails};