const axios = require('axios');
const fs = require('fs');
const https = require('https');
 
const certPath = "./Certificate/BetfairApp1.crt";
const caPath = "./Certificate/client-2048.pem";
const keyPath = "./Certificate/private_key.pem";  // Add Private Key
 
const userLoginData = async () => {
  const payload = new URLSearchParams({
    username: "admin@gbrbets.com",
    password: "Niva71gbmvl!"
  }).toString();
 
  const headers = {
    'X-Application': "test",
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json'
  };
 
  try {
    const agent = new https.Agent({
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath),  // Include the Private Key
      ca: fs.readFileSync(caPath),
      secureProtocol: 'TLSv1_2_method',
      ciphers: 'HIGH:!DH:!aNULL',
      honorCipherOrder: true,
      rejectUnauthorized: false
    });
 
    const response = await axios.post(
      'https://identitysso-cert.betfair.com/api/certlogin',
      payload,
      { httpsAgent: agent, headers }
    );
 
    const apiData = response.data;
 
    console.log("Login Success", apiData);
    return apiData;
  }
  catch (error) {
    console.error("Login Failed:", error.response ? error.response.data : error.message);
  }
}
 
module.exports = { userLoginData };