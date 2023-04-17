// server/db/session.js

const db = require('./database');

async function createUser(userData, accessToken, refreshToken, expiresAt) {
  return new Promise((resolve, reject) => {
    // Check if the user already exists in the database
    db.get('SELECT * FROM users WHERE discord_id = ?', [userData.id], (err, row) => {
      if (err) {
        return reject(err);
      }

      if (row) {
        // User already exists; update their access token and refresh token
        db.run('UPDATE users SET access_token = ?, refresh_token = ?, expires_at = ? WHERE discord_id = ?', [accessToken, refreshToken, expiresAt, userData.id], (err) => {
          if (err) {
            return reject(err);
          }
          resolve({ ...row, user_id: row.id });
        });
      } else {
        // User doesn't exist; insert a new user record
        db.run(
          'INSERT INTO users (discord_id, username, discriminator, access_token, refresh_token, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
          [userData.id, userData.username, userData.discriminator, accessToken, refreshToken, expiresAt],
          function (err) {
            if (err) {
              return reject(err);
            }
            const user_id = this.lastID;
            resolve({ ...userData, access_token: accessToken, refresh_token: refreshToken, expires_at: expiresAt, id: user_id, user_id: user_id });
          }
        );
      }
    });
  });
}

async function updateAccessToken(user_id, newAccessToken, newRefreshToken, expiresAt) {
  return new Promise((resolve, reject) => {
    db.run('UPDATE users SET access_token = ?, refresh_token = ?, expires_at = ? WHERE id = ?', [newAccessToken, newRefreshToken, expiresAt, user_id], (err) => {
      if (err) {
        return reject(err);
      }
      resolve(newAccessToken, newRefreshToken, expiresAt);
    });
  });
}

// server/db/session.js
async function getUserDataFromDatabase({ user_id, discord_id }) {
  return new Promise((resolve, reject) => {
    let query;
    let params;

    if (user_id) {
      query = 'SELECT users.id, discord_id, username, discriminator, access_token, refresh_token, expires_at FROM users WHERE users.id = ?';
      params = [user_id];
    } else if (discord_id) {
      query = 'SELECT users.id, discord_id, username, discriminator, access_token, refresh_token, expires_at FROM users WHERE users.discord_id = ?';
      params = [discord_id];
    } else {
      return reject(new Error('No user_id or discord_id provided.'));
    }

    db.get(query, params, (err, row) => {
      if (err) {
        return reject(err);
      }
      resolve(row);
    });
  });
}

module.exports = {
  createUser,
  getUserDataFromDatabase,
  updateAccessToken
};
