// server/src/controllers/userController.js
let users = [];

const axios = require('axios');
const qs = require('qs');
const jwt = require('jsonwebtoken')

const { createUser, getUserDataFromDatabase, updateAccessToken } = require('../db/session'); // Import the functions
const { jwtSecret, DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_REDIRECT_URI } = require('../config');

async function discordOAuth2(req, res) {
    const { code } = req.query;
    // const { DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_REDIRECT_URI } = process.env;  
    try {
        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', qs.stringify({
            client_id: DISCORD_CLIENT_ID,
            client_secret: DISCORD_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code,
            redirect_uri: DISCORD_REDIRECT_URI,
        }), {
            headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const { access_token: accessToken, refresh_token: refreshToken } = tokenResponse.data;

        // Retrieve the user's information using the access token
        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        // After retrieving the user's data
        const userData = userResponse.data;

        // Generate a session token (e.g., a JSON Web Token or JWT)
        const sessionToken = jwt.sign({ user_id: userData.id }, jwtSecret, { expiresIn: '1h' });

        // Save the access token, userData, and sessionToken in your database, and create a session for the user
        const session = await createUser(userData, accessToken, refreshToken);

        // Redirect the user back to your frontend, sending the session token as a query parameter
        console.log("REDIRECTING TO HOME PAGE")
        res.redirect(`http://localhost:3000?sessionToken=${sessionToken}`); // Replace with the appropriate frontend route
    } catch (error) {
      console.error('Error during Discord OAuth2:', error);
      res.status(500).json({ error: 'Internal server error' });
      console.log(error.response)
    }
  }

  async function refreshAccessToken(req, res) {
    try {
      const { user_id } = req.user;
      const userData = await getUserDataFromDatabase({ discord_id: user_id });
  
      if (!userData) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
  
      const refreshToken = userData.refresh_token; // Change this line
      const newAccessToken = await getNewAccessToken(refreshToken);
  
      // Update the access token in the database
      await updateAccessToken(user_id, newAccessToken);
  
      res.json({ access_token: newAccessToken });
    } catch (error) {
      console.error('Error refreshing access token:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }  
  
async function getNewAccessToken(refreshToken) {
    try{
        console.log('Refresh token:', refreshToken);
        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', {
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        }, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        });

    
        const { access_token: newAccessToken } = tokenResponse.data;
        return newAccessToken;
    } catch (error) {
        console.error('Error refreshing access token:', error);
        console.log('Error response:', error.response.data);
        throw error;
    }
}


  async function getCurrentUser(req, res) {
    try {
      const { user_id } = req.user;
  
      if (!user_id) {
        console.log("No user ID in request body.");
        return res.status(401).json({ error: 'Unauthorized' });
      }
  
      console.log(`Looking up user ${user_id}`);
  
      const userData = await getUserDataFromDatabase({ discord_id: user_id });
  
      if (!userData) {
        console.log(`User not found for ID ${user_id}`);
        return res.status(401).json({ error: 'Unauthorized' });
      }
      console.log(`User found \n\tID: ${userData.id}`)
  
      res.json(userData);
    } catch (error) {
      console.error('Error fetching current user:', error);
      return res.status(500).json({ error: 'Server error.' });
    }
  }

module.exports = { discordOAuth2, getCurrentUser, refreshAccessToken, updateAccessToken, getUserDataFromDatabase, getNewAccessToken };