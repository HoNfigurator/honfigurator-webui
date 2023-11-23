// index.js
const path = require('path');
const envFilePath = path.join(__dirname, `.env.${process.env.NODE_ENV || 'development'}`);
const dotenv = require('dotenv');
dotenv.config({ path: envFilePath });
const fs = require('fs');
const https = require('https');
const userRoutes = require('../routes/userRoutes');
const serverRoutes = require('../routes/serverRoutes');

console.log(envFilePath);

console.log(process.env.DISCORD_CLIENT_ID);

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.use('/api-ui', userRoutes);
app.use('/api', serverRoutes);


if (process.env.NODE_ENV === "production") {
  const privateKey = fs.readFileSync(process.env.CERTIFICATE_KEY, 'utf8');
  const certificate = fs.readFileSync(process.env.CERTIFICATE_FILE, 'utf8');
  const ca = fs.readFileSync(process.env.CERTIFICATE_CHAIN, 'utf8');
  const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca
  };
  const httpsServer = https.createServer(credentials, app);
  httpsServer.listen(PORT, () => {
    console.log(`HTTPS server is running on port ${PORT}`);
  });
} else {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  })
};