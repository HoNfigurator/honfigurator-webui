const { createProxyMiddleware } = require('http-proxy-middleware');
const https = require('https');
const fs = require('fs');

const agent = new https.Agent({
  ca: fs.readFileSync('fullchain.pem'),
  rejectUnauthorized: true
});

module.exports = function (app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
    })
  );

  app.use(
    '/api-ui',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
    })
  );
};