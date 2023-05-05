const db = require('./database');

class CustomError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function createUser(userData, accessToken, refreshToken, expiresAt) {
  return new Promise((resolve, reject) => {
    // Check if the user already exists in the database
    db.get('SELECT * FROM users WHERE discord_id = ?', [userData.id], (err, row) => {
      if (err) {
        return reject(new CustomError(500, `Error checking for existing user: ${err.message}`));
      }

      if (row) {
        // User already exists; update their access token and refresh token
        db.run('UPDATE users SET access_token = ?, refresh_token = ?, expires_at = ? WHERE discord_id = ?', [accessToken, refreshToken, expiresAt, userData.id], (err) => {
          if (err) {
            return reject(new CustomError(500, `Error updating user tokens: ${err.message}`));
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
              return reject(new CustomError(500, `Error creating user: ${err.message}`));
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
    db.run('UPDATE users SET access_token = ?, refresh_token = ?, expires_at = ? WHERE discord_id = ?', [newAccessToken, newRefreshToken, expiresAt, user_id], (err) => {
      if (err) {
        return reject(new CustomError(500, `Error updating access token: ${err.message}`));
      }
      resolve(newAccessToken, newRefreshToken, expiresAt);
    });
  });
}

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
      return reject(new CustomError(400, 'No user_id or discord_id provided.'));
    }

    db.get(query, params, (err, row) => {
      if (err) {
        return reject(new CustomError(500, `Error getting user data: ${err.message}`));
      }
      resolve(row);
    });
  });
}

async function getUserServersFromDatabase(user_id) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM servers WHERE user_id = ?', [user_id], (err, rows) => {
      if (err) {
        return reject(new CustomError(500, `Error getting user servers: ${err.message}`));
      }
      resolve(rows);
    });
  });
}

async function createServerForUser(user_id, name, address, port) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO servers (user_id, name, address, port) VALUES (?, ?, ?, ?)',
      [user_id, name, address, port],
      function (err) {
        if (err) {
          return reject(new CustomError(500, `Error creating server: ${err.message}`));
        }
        const server_id = this.lastID;
        resolve({ id: server_id, user_id, name, address });
      }
    );
  });
}

async function checkForExistingServer(user_id, name, address, port) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM servers WHERE (name = ? or address = ?) and user_id = ? and port = ?', [name, address, user_id, port], (err, rows) => {
      if (err) {
        return reject(new CustomError(500, `Error checking for existing server: ${err.message}`));
      }
      resolve(rows);
    });
  });
}

async function updateServerForUser(user_id, oldName, oldAddress, oldPort, newName, newAddress, newPort) {
  return new Promise((resolve, reject) => {
    db.run('UPDATE servers SET name = ?, address = ?, port = ? WHERE name = ? AND user_id = ?', [newName, newAddress, newPort, oldName, user_id], (err) => {
      if (err) {
        return reject(new CustomError(500, `Error updating server: ${err.message}`));
      }
      resolve(oldName, oldAddress, newName, newAddress);
    });
  });
}

async function deleteServerForUser(user_id, name) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM servers WHERE name = ? AND user_id = ?', [name, user_id], (err) => {
      if (err) {
        return reject(new CustomError(500, `Error deleting server: ${err.message}`));
      }
      resolve({ success: true });
    });
  });
}

module.exports = {
  createUser,
  getUserDataFromDatabase,
  updateAccessToken,
  getUserServersFromDatabase,
  createServerForUser,
  checkForExistingServer,
  updateServerForUser,
  deleteServerForUser
};