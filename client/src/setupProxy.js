const { createProxyMiddleware } = require('http-proxy-middleware');
const https = require('https');
const fs = require('fs');

const agent = new https.Agent({
  ca: fs.readFileSync('root_ca_cert.pem'),
  rejectUnauthorized: true
});

module.exports = function (app, selectedServer) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
      onProxyReq: (proxyReq, req, res) => {
        // Modify the request body to include the selected server
        const requestBody = JSON.stringify({
          ...JSON.parse(req.body || '{}'),
          server: selectedServer,
        });
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(requestBody));
        proxyReq.write(requestBody);
        proxyReq.end();
      },
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
