const { userLoginData } = require("../Controllers/authController");
 
async function Token() {
  try {
    const apiData = await userLoginData();
    return apiData.sessionToken;
  } catch (err) {
    console.error("Token is not generated:", err.message);
    return null;
  }
}
 
module.exports = Token;
 