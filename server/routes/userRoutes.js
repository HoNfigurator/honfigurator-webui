// server/routes/userroutes.js

const express = require('express');
const userController = require('../controllers/userController');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { jwtSecret } = require('../config');

const router = express.Router();

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
      if (error.name === 'TokenExpiredError') {
        console.log('Token expired, refreshing...');
  
        const userData = await userController.getUserDataFromDatabase({ discord_id: jwt.decode(token).user_id });
  
        try {
          console.log('Requesting new access token now');
          const newAccessToken = await userController.getNewAccessToken(userData.refresh_token);
          const decoded = jwt.verify(newAccessToken, jwtSecret, { algorithms: ['HS256'] });
  
          await userController.updateAccessToken(userData.discord_id, newAccessToken);
  
          req.user = { user_id: decoded.user_id };
          next();
        } catch (error) {
          console.error('Failed to refresh access token:', error);
          return res.status(401).json({ error: 'Internal server error' });
        }
      } else {
        console.error('Token verification error:', error);
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }
  }
  

// Register a new user (deprecated)
//router.post('/user/register', userController.createUser);

// Authenticate an existing user (deprecated)
//router.post('/user/authenticate', userController.authenticateUser);

// Authenticate a user with Discord OAUTH2
router.get('/user/auth/discord/callback', userController.discordOAuth2);

// Get the current users details
router.get('/user/current', authMiddleware, userController.getCurrentUser);


module.exports = router;
