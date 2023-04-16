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
    refresh_token TEXT
  )`,
  (err) => {
    if (err) {
      console.error('Error initializing the "users" table:', err);
    } else {
      console.log('Initialized the "users" table');
    }
  }
);

db.run(
  `CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    token TEXT UNIQUE,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`,
  (err) => {
    if (err) {
      console.error('Error initializing the "sessions" table:', err);
    } else {
      console.log('Initialized the "sessions" table');
    }
  }
);


module.exports = db;
