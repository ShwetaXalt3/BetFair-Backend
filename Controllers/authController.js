const axios = require('axios');
const fs = require('fs');
const https = require('https');
 
const certPath = "./Certificate/BetfairApp1.crt";
const caPath = "./Certificate/client-2048.pem";
const keyPath = "./Certificate/private_key.pem";
 
let sessionToken = null; // Store token in memory
 
  const userLoginData = async (req,res) => {
    // Return cached token if available
    if (sessionToken) {
      return { sessionToken };
    }
   
    const {user,userPass}=req.body;
 
  const username="admin@gbrbets.com";
  const password="Niva71gbmvl!";
 
  const payload = new URLSearchParams({
    username:username,
    password:password
  }).toString();
 
  
 
  if (user === username && userPass === password) {
    console.log("User Login Successfully");
    res.status(200).json({
      success: true,
      message: "User Login Successfully",
      token: req.body.token
  })
  }
  else {
    console.log("Unauthorized User");
    return res.status(401).json({ message: "Unauthorized User" });
  }
 
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