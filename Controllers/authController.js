const axios = require('axios');
const fs = require('fs');
const https = require('https');
 
const certPath = "./Certificate/BetfairApp1.crt";
const caPath = "./Certificate/client-2048.pem";
const keyPath = "./Certificate/private_key.pem";
 
let sessionToken = null; // Store token in memory
 
const userLoginData = async () => {
  // Return cached token if available
  if (sessionToken) {
    // console.log("Using existing session token:", sessionToken);
    return { sessionToken };
  }
 
  // console.log("Fetching new session token...");
 
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
      key: fs.readFileSync(keyPath),
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
 
    if (apiData.sessionToken) {
      sessionToken = apiData.sessionToken;
      // console.log("New session token acquired:", apiData);
      return apiData;
    } else {
       return
    }
  } catch (error) {
    console.error("Login Failed:", error.response?.data || error.message);
    throw new Error("Authentication failed");
  }
};
 
module.exports = { userLoginData };