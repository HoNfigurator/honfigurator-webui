// helpers/tokenManager.js
const { Mutex } = require('async-mutex');
const jwt = require('jsonwebtoken');

const { jwtSecret, DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET } = require('../config');

class TokenManager {
    constructor(oauth, user_id, getUserDataFromDatabase, updateAccessToken) {
      this.mutex = new Mutex();
      this.token = null;
      this.oauth = oauth;
      this.user_id = user_id;
      this.getUserDataFromDatabase = getUserDataFromDatabase;
      this.updateAccessToken = updateAccessToken;
    }
  

  async refreshToken(refreshTokenFunc) {
    const release = await this.mutex.acquire();

    try {
      // Check if the token has already been refreshed
      if (this.token && !this.isTokenExpired(this.token)) {
        return this.token;
      }

      this.token = await refreshTokenFunc();
      return this.token;
    } finally {
      release();
    }
  }

  async refreshTokenFunc() {
    const userData = await this.getUserDataFromDatabase({ discord_id: this.user_id });
  
    if (!userData) {
      throw new Error('Unauthorized');
    }
  
    const refreshToken = userData.refresh_token;
    const newTokenResponse = await this.oauth.tokenRequest({
      clientId: DISCORD_CLIENT_ID,
      clientSecret: DISCORD_CLIENT_SECRET,
      grantType: 'refresh_token',
      refreshToken,
    });
  
    const newAccessToken = newTokenResponse.access_token;
    const newRefreshToken = newTokenResponse.refresh_token;
    const expiresIn = newTokenResponse.expires_in;

    const expiresAt = Date.now() + expiresIn * 1000;
  
    await this.updateAccessToken(this.user_id, newAccessToken, newRefreshToken, expiresAt);
    return newAccessToken;
  }
  

  isTokenExpired(token) {
    try {
      jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
      return false;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return true;
      } else {
        throw error;
      }
    }
  }
}

module.exports = TokenManager;
