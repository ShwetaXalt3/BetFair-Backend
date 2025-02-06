const { userLoginData } = require("../Controllers/authController");
 
async function Token(req, res) {
  try {
    const apiData = await userLoginData();
//  res.status(200);
    return apiData.sessionToken;
  } catch (err) {
    console.error("Token is not generated:", err.message);
    return null;
  }
}
 
module.exports = Token;
 