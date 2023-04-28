const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');
const https = require('https');
const express = require('express');
const bodyParser = require('body-parser');
const userRoutes = require('../routes/userRoutes');
const serverRoutes = require('../routes/serverRoutes');

const envFilePath = path.join(__dirname, `.env.${process.env.NODE_ENV || 'development'}`);
dotenv.config({ path: envFilePath });
console.log(envFilePath);

console.log(process.env.DISCORD_CLIENT_ID);

if (envFilePath === "production") {
  const privateKey = fs.readFileSync('privkey.pem', 'utf8');
  const certificate = fs.readFileSync('cert.pem', 'utf8');
  const ca = fs.readFileSync('fullchain.pem', 'utf8');
  const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca
  };
}

const app = express();
const PORT = process.env.PORT || 3001;
app.use(bodyParser.json());
app.use('/api-ui', userRoutes);
app.use(express.json()); // Add this line
app.use('/api', serverRoutes);

if (envFilePath === "production") {
  const httpsServer = https.createServer(credentials, app);
  httpsServer.listen(PORT, () => {
    console.log(`HTTPS server is running on port ${PORT}`);
  });
} else {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}