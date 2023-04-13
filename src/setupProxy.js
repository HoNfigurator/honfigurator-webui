const { createProxyMiddleware } = require('http-proxy-middleware');
const https = require('https');
const fs = require('fs');

const agent = new https.Agent({
  ca: fs.readFileSync('C:/Users/honserver4/Documents/honfigurator-ui/root_ca_cert.pem'),
  rejectUnauthorized: true
});

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://localhost:5000',
      changeOrigin: true,
      secure: true,
      agent: agent
    })
  );
};
