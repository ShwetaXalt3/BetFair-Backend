const axios = require('axios');
const fs = require('fs');
const https = require('https');
 
const certPath = "./Certificate/BetfairApp1.crt";
const caPath = "./Certificate/client-2048.pem";
const keyPath = "./Certificate/private_key.pem";
 
// Store the session token inside an object so it remains mutable
let sessionToken = { token: null };
 
const userLoginData = async (req, res) => {
  const { user, userPass } = req.body;
 
  const payload = new URLSearchParams({
    username: user,
    password: userPass
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
      console.log("New session token acquired:", apiData.sessionToken);
      sessionToken.token = apiData.sessionToken; // ✅ Correctly updating the object property
 
      return res.status(200).json({
        success: true,
        message: "User Login Successfully",
        sessionToken: apiData.sessionToken
      });
    } else {
      return res.status(500).json({ message: "Login Failed" });
    }
  } catch (error) {
    console.error("Login Failed:", error.response?.data || error.message);
    return res.status(500).json({ message: "Authentication failed" });
  }
};
 
module.exports = { userLoginData, sessionToken };
 
 
 