const express = require('express');
const router = express.Router();
const axios = require('axios');
const session = require('../db/session');
const { jwtSecret } = require('../config');
const jwt = require('jsonwebtoken');
const https = require('https');
const fs = require('fs');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const agent = new https.Agent({
  rejectUnauthorized: false
});

const addAccessToken = async (req, res, next) => {
    try {
        // Extract the user ID from the JWT token
        const authHeader = req.headers.authorization;
        const token = authHeader.split(' ')[1];
        // console.log(`addAccessToken:\n\ttoken: ${token}`)
        const decodedToken = jwt.verify(token, jwtSecret);
        const userId = decodedToken.user_id;

        // console.log(`addAccessToken:\n\tDiscord ID: ${userId}`);

        // Get the user's access token from the database
        const userData = await session.getUserDataFromDatabase({ discord_id: userId });
        const accessToken = userData.access_token;

        // Add the access token to the request headers
        req.headers.authorization = `Bearer ${accessToken}`;
        next();
    } catch (error) {
        console.error('Failed to retrieve access token from database:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const createProxyHandler = (path, method) => {
    return async (req, res) => {
      try {
        console.log(`Requesting ${path}`)
        const response = await axios({
            url: `https://localhost:5000${path}`,
            method: method,
            headers: {
                ...req.headers,
                'Content-Type': 'application/json',
                'Authorization': req.headers.authorization
            },
            data: req.body,
            httpsAgent: agent
        });
        res.status(response.status).json(response.data);
      } catch (error) {
        console.error(error);
        res.status(error.response.status).json(error.response.data);
      }
    };
  };

  const createProxyHandlerWithParams = (path, method) => {
    return async (req, res) => {
      try {
        const fullPath = Object.entries(req.params).reduce(
          (currentPath, [key, value]) => currentPath.replace(`:${key}`, value),
          path
        );
        console.log(`Requesting ${fullPath}`);
        const response = await axios({
          url: `https://localhost:5000${fullPath}`,
          method: method,
          headers: {
            ...req.headers,
            'Content-Type': 'application/json',
            'Authorization': req.headers.authorization,
          },
          data: req.body,
          httpsAgent: agent,
        });
        res.status(response.status).json(response.data);
      } catch (error) {
        console.error(error);
        res.status(error.response.status).json(error.response.data);
      }
    };
  };
  


/*
    Role getters
*/
router.get('/permissions/all', addAccessToken, createProxyHandler('/api/permissions/all', 'get'));
router.get('/users/all', addAccessToken, createProxyHandler('/api/users/all', 'get'));
router.post('/users/add', addAccessToken, createProxyHandler('/api/users/add', 'post'));
router.delete('/users/delete/:discord_id', addAccessToken, createProxyHandlerWithParams('/api/users/delete/:discord_id', 'delete'));

/*
    Role setters
*/
router.get('/roles/all', addAccessToken, createProxyHandler('/api/roles/all', 'get'));
router.post('/roles/add', addAccessToken, createProxyHandler('/api/roles/add', 'post'));
router.delete('/roles/delete/:role_name', addAccessToken, createProxyHandlerWithParams('/api/roles/delete/:role_name', 'delete'));


/*
    Server getters
*/
router.get('/get_server_config_item', addAccessToken, async (req, res) => {
    const { key } = req.query;
    createProxyHandler(`/api/get_server_config_item?key=${key}`, 'get')(req, res);
});
router.get('/get_total_allowed_servers', addAccessToken, createProxyHandler('/api/get_total_allowed_servers', 'get'));
router.get('/get_total_servers', addAccessToken, createProxyHandler('/api/get_total_servers', 'get'));
router.get('/get_total_cpus', addAccessToken, createProxyHandler('/api/get_total_cpus', 'get'));
router.get('/get_num_reserved_cpus', addAccessToken, createProxyHandler('/api/get_num_reserved_cpus', 'get'));
router.get('/get_cpu_usage', addAccessToken, createProxyHandler('/api/get_cpu_usage', 'get'));
router.get('/get_memory_usage', addAccessToken, createProxyHandler('/api/get_memory_usage', 'get'));
router.get('/get_memory_total', addAccessToken, createProxyHandler('/api/get_memory_total', 'get'));
router.get('/get_num_players_ingame', addAccessToken, createProxyHandler('/api/get_num_players_ingame', 'get'));
router.get('/get_num_matches_ingame', addAccessToken, createProxyHandler('/api/get_num_matches_ingame', 'get'));
router.get('/get_instances_status', addAccessToken, createProxyHandler('/api/get_instances_status', 'get'));

router.get('/get_skipped_frame_data', addAccessToken, async (req, res) => {
    const { port } = req.query;
    createProxyHandler(`/api/get_skipped_frame_data?port=${port}`, 'get')(req, res);
});


/*
    Server control
*/
router.post('/stop_server', addAccessToken, createProxyHandler('/api/stop_server', 'post'));
router.post('/start_server', addAccessToken, createProxyHandler('/api/start_server', 'post'));

module.exports = router;