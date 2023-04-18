// server/routes/userRoutes.js

const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { jwtSecret, SESSION_TIMEOUT } = require('../config');

const userController = require('../controllers/userController');
const TokenManager = require('../helpers/tokenManager');
const { oauth } = require('../controllers/userController');

const router = express.Router();

// Authenticate a user with Discord OAUTH2
router.get('/user/auth/discord/callback', userController.discordOAuth2);

// Get the current users details
router.get('/user/current', authMiddleware, discordAuthMiddleware, userController.getCurrentUser);

// Reauthenticate a user, against stored discord tokens
router.get('/user/reauth', discordAuthMiddleware, userController.reauthenticateUser);

// In your server's routes/userRoutes.js file
router.post('/user/refresh', authMiddlewareAllowExpired, discordAuthMiddleware, async (req, res) => {
    try {
      console.log(`received refresh request. ${req.user.user_id}`);
  
      // Check for user inactivity
      const currentTime = Math.floor(Date.now() / 1000);
      const inactivityWindow = 3600; // Set the inactivity window in seconds
      if (req.tokenExpired && currentTime - req.user.iat > inactivityWindow) {
        console.log("User's inactivity period exceeded. Logging out.");
        res.status(401).json({ error: 'User inactivity period exceeded' });
        return;
      }
  
      // Generate a new session token
      const newSessionToken = jwt.sign({ user_id: req.user.user_id }, jwtSecret, { expiresIn: SESSION_TIMEOUT });

      // Calculate the token expiration time
      const tokenExpiration = new Date(jwt.decode(newSessionToken).exp * 1000).toISOString();
  
      res.json({ sessionToken: newSessionToken, user: req.user, tokenExpiry: tokenExpiration });
    } catch (error) {
      console.error('Failed to refresh session token:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  


  // check for valid but expired token
async function authMiddlewareAllowExpired(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No auth header');
      return res.status(401).json({ error: 'Unauthorized' });
    }
  
    const token = authHeader.split(' ')[1];
    if (!token) {
      console.log('No token');
      return res.status(401).json({ error: 'Unauthorized' });
    }
  
    if (typeof token !== 'string') {
      console.log('Token is not a string');
      return res.status(401).json({ error: 'Unauthorized' });
    }
  
    try {
      const decoded = jwt.verify(token, jwtSecret, { algorithms: ['HS256'], ignoreExpiration: true });
  
      // Check if the token has expired
      const isExpired = (Date.now() / 1000 - decoded.iat) > decoded.exp;
  
      if (isExpired) {
        req.tokenExpired = true;
      }
  
      req.user = { user_id: decoded.user_id };
      next();
    } catch (error) {
      console.error('JWT token verification error:', error);
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }
  

// Custom authMiddleware
async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('No auth header');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        console.log('No token');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (typeof token !== 'string') {
        console.log('Token is not a string');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const decoded = await jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });

        req.user = { user_id: decoded.user_id };
        next();
    } catch (error) {
        console.error('JWT token verification error:', error);
        return res.status(401).json({ error: 'Unauthorized' });
    }
}

async function discordAuthMiddleware(req, res, next) {
    try {
        console.log(`discord token verification. ${req.user.user_id}`)
        const userData = await userController.getUserDataFromDatabase({ discord_id: req.user.user_id });

        // Check if the access token is about to expire or has already expired
        if (Date.now() >= userData.expires_at - 60 * 1000) {
            console.log('Discord access token expired or about to expire, refreshing...');

            const tokenManager = new TokenManager(oauth, userData.discord_id, userController.getUserDataFromDatabase, userController.updateAccessToken);
            const { newAccessToken, newRefreshToken, expiresIn } = await tokenManager.refreshToken(tokenManager.refreshTokenFunc.bind(tokenManager));

            // Calculate the new expiration timestamp
            const expiresAt = Date.now() + expiresIn * 1000;

            console.log(`New Discord access token: ${newAccessToken}`);

            await userController.updateAccessToken(userData.user_id, newAccessToken, newRefreshToken, expiresAt);
        }

        next();
    } catch (error) {
        console.error('Failed to refresh Discord access token:', error);
        return res.status(401).json({ error: 'Internal server error' });
    }
}

async function refreshDiscordToken(user_id, discord_id) {
    try {
      const userData = await userController.getUserDataFromDatabase({ discord_id });
  
      if (Date.now() >= userData.expires_at - 60 * 1000) {
        console.log('Discord access token expired or about to expire, refreshing...');
  
        const tokenManager = new TokenManager(oauth, discord_id);
        const newAccessToken = await tokenManager.refreshToken(tokenManager.refreshTokenFunc.bind(tokenManager));
  
        console.log(`New Discord access token: ${newAccessToken}`);
      }
    } catch (error) {
      console.error('Failed to refresh Discord access token:', error);
      throw error;
    }
}  

module.exports = router;
