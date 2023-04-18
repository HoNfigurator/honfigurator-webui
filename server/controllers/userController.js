// server/src/controllers/userController.js
const axios = require('axios');
const jwt = require('jsonwebtoken');
const DiscordOAuth2 = require('discord-oauth2');
const oauth = new DiscordOAuth2();

const { createUser, getUserDataFromDatabase, updateAccessToken } = require('../db/session'); // Import the functions
const { jwtSecret, DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_REDIRECT_URI, SESSION_TIMEOUT } = require('../config');
const TokenManager = require('../helpers/tokenManager');

// server/controllers/userController.js
async function reauthenticateUser(req, res) {
    try {
      const authHeader = req.headers.authorization;
      console.log(authHeader);
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
  
      const token = authHeader.split(' ')[1];
      console.log(token);
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
  
      // Verify and decode the token to get the user_id (discord_id)
      const decoded = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
      const user_id = decoded.user_id;
  
      console.log(user_id);
      const userData = await getUserDataFromDatabase({ discord_id: user_id });
  
      if (!userData) {
        return res.status(401).json({ error: 'User not found' });
      }
  
      // If access_token is expired, try to refresh it
      if (Date.now() >= userData.expires_at) {
        const tokenManager = new TokenManager(oauth, userData.discord_id, getUserDataFromDatabase, updateAccessToken);
        const { newAccessToken, newRefreshToken, expiresIn } = await tokenManager.refreshToken(tokenManager.refreshTokenFunc.bind(tokenManager));
  
        // Calculate the new expiration timestamp
        const expiresAt = Date.now() + expiresIn * 1000;
  
        await updateAccessToken(userData.user_id, newAccessToken, newRefreshToken, expiresAt);
      }
  
      // Generate a new session token for the user
      const sessionToken = jwt.sign({ user_id: userData.user_id }, jwtSecret, { expiresIn: SESSION_TIMEOUT });

      // Calculate the token expiration time
      const tokenExpiration = new Date(Date.now() + jwt.decode(sessionToken).exp * 1000).toISOString();
      
      res.json({ sessionToken: sessionToken, user_data: userData, tokenExpiration: tokenExpiration });
  
    } catch (error) {
        console.error('Error during reauthentication:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
  

async function discordOAuth2(req, res) {
    const { code } = req.query;
    try {
        const tokenResponse = await oauth.tokenRequest({
            clientId: DISCORD_CLIENT_ID,
            clientSecret: DISCORD_CLIENT_SECRET,
            grantType: 'authorization_code',
            code,
            scope: 'identify',
            redirectUri: DISCORD_REDIRECT_URI,
        });

        const { access_token: accessToken, refresh_token: refreshToken, expires_in: expiresIn } = tokenResponse;

        // Calculate the expiration timestamp
        const expiresAt = Date.now() + expiresIn * 1000;

        // Retrieve the user's information using the access token
        const userResponse = await oauth.getUser(accessToken);

        // After retrieving the user's data
        const userData = userResponse;

        // Generate a session token (e.g., a JSON Web Token or JWT)
        const sessionToken = jwt.sign({ user_id: userData.id }, jwtSecret, { expiresIn: SESSION_TIMEOUT });

        const tokenExpiration = new Date(jwt.decode(sessionToken).exp * 1000).toISOString();
        console.log(`expiration! ${tokenExpiration}`);
        // Save the access token, userData, and sessionToken in your database, and create a session for the user
        console.log(`New OAUTH: Updating discord data.\n\taccess_token: ${accessToken}\n\trefresh_token: ${refreshToken}\n\texpires at: ${expiresAt}`)
        const session = await createUser(userData, accessToken, refreshToken, expiresAt);

        // Redirect the user back to your frontend, sending the session token as a query parameter
        res.redirect(`http://localhost:3000?sessionToken=${sessionToken}&tokenExpiry=${tokenExpiration}`); // Replace with the appropriate frontend route
    } catch (error) {
        console.error('Error during Discord OAuth2:', error);
        res.status(500).json({ error: 'Internal server error' });
        console.log(error.response)
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

module.exports = { discordOAuth2, getCurrentUser, updateAccessToken, getUserDataFromDatabase, reauthenticateUser, oauth }; // Add oauth to the exports