// server/db/database.js

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the SQLite database file 'users.db' in the 'db' folder
const db = new sqlite3.Database(path.join(__dirname, 'users.db'), (err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the SQLite database');
});

// Initialize the 'users' table if it doesn't exist
db.run(
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    discord_id TEXT UNIQUE,
    username TEXT,
    discriminator TEXT,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP
  )`,
  createTableCallback('users')
);

db.run(
  `CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    token TEXT UNIQUE,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`,
  createTableCallback('sessions')
);

db.run(
  `CREATE TABLE IF NOT EXISTS servers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    port INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`,
  createTableCallback('servers')
);

function createTableCallback(tableName) {
  return (err) => {
    if (err) {
      console.error(`Error initializing the "${tableName}" table:`, err);
    } else {
      console.log(`Initialized the "${tableName}" table`);
      if (tableName === 'servers') {
        addPortColumnIfNotExists();
      }
    }
  };
}

function addPortColumnIfNotExists() {
  db.all("PRAGMA table_info(servers);", (err, rows) => {
    if (err) {
      console.error('Error checking for port column:', err);
      return;
    }

    const hasPortColumn = rows.some(row => row.name === 'port');
    if (!hasPortColumn) {
      db.run('ALTER TABLE servers ADD COLUMN port INTEGER DEFAULT 5000;', (err) => {
        if (err) {
          console.error('Error adding port column:', err);
        } else {
          console.log('Added port column with default value 5000');
          updateExistingServerPortValues();
        }
      });
    }
  });
}

function updateExistingServerPortValues() {
  db.run('UPDATE servers SET port = 5000 WHERE port IS NULL;', (err) => {
    if (err) {
      console.error('Error updating port values:', err);
    } else {
      console.log('Updated existing server port values to 5000');
    }
  });
}


module.exports = db;
