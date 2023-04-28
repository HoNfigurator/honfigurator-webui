const express = require('express');
const axios = require('axios');
const session = require('../db/session');
const jwt = require('jsonwebtoken');
const https = require('https');
const fs = require('fs');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const agent = new https.Agent({
    rejectUnauthorized: false
});

function removeTimestampParam(req, res, next) {
    if (req.query.timestamp) {
        delete req.query.timestamp;
        const urlWithoutTimestamp = req.originalUrl.replace(/[?&]_t=\d+/, '');
        console.log(urlWithoutTimestamp);
        req.url = urlWithoutTimestamp;
    }
    next();
}


const router = express.Router();
router.use(removeTimestampParam);

function getTargetUrl(path, req) {
    const selectedServer = req.headers['selected-server'];
    // console.log(`Selected server is ${selectedServer}`);
    const baseUrl = selectedServer ? `https://${selectedServer}:5000` : 'https://localhost:5000';
    // console.log(`Target URL is ${baseUrl}${path}`)
    return `${baseUrl}${path}`;
}


const addAccessToken = async (req, res, next) => {
    try {
        // Extract the user ID from the JWT token
        const authHeader = req.headers.authorization;
        const token = authHeader.split(' ')[1];
        // console.log(`addAccessToken:\n\ttoken: ${token}`)
        const decodedToken = jwt.verify(token, process.env.jwtSecret);
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
        let url = '';
        let status_code = '';
        try {
            const newQuery = Object.entries(req.query)
                .filter(([key]) => key !== 'timestamp')
                .map(([key, value]) => `${key}=${value}`)
                .join('&');
            const newPath = newQuery ? `${path}?${newQuery}` : path;
            url = getTargetUrl(newPath, req);
            const response = await axios({
                url: url,
                method: method,
                headers: {
                    ...req.headers,
                    'Content-Type': 'application/json',
                    'selected-server': req.headers['selected-server'], // Add this line
                    Authorization: req.headers.authorization,
                },
                data: req.body, // Add this line
                httpsAgent: agent,
            });
            res.status(response.status).json(response.data);
            status_code = response.status;
        } catch (error) {
            // console.error(error);
            if (error.response) {
                res.status(error.response.status).json(error.response.data);
                status_code = error.response.status;
            } else {
                status_code = 500;
                res.status(status_code).json({ error: `Internal server error occured. ${error}` });
                // console.error(error);
            }
        } finally {
            console.log(`[${status_code}] - ${url}`);
        }
    };
}

const createProxyHandlerWithParams = (path, method) => {
    return async (req, res) => {
        try {
            const fullPath = Object.entries(req.params).reduce(
                (currentPath, [key, value]) => currentPath.replace(`:${key}`, value),
                path
            );

            const newQuery = Object.entries(req.query)
                .filter(([key]) => key !== 'timestamp')
                .map(([key, value]) => `${key}=${value}`)
                .join('&');

            const newPath = newQuery ? `${fullPath}?${newQuery}` : fullPath;
            const url = getTargetUrl(newPath, req);
            console.log(url);

            const response = await axios({
                url: url,
                method: method,
                headers: {
                    ...req.headers,
                    'Content-Type': 'application/json',
                    'selected-server': req.headers['selected-server'],
                    'Authorization': req.headers.authorization,
                },
                data: req.body,
                httpsAgent: agent,
            });
            res.status(response.status).json(response.data);
        } catch (error) {
            if (error.response) {
                res.status(error.response.status).json(error.response.data);
            } else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    };
};

/*
    Role getters
*/
router.get('/permissions/all', addAccessToken, createProxyHandler('/api/permissions/all', 'get'));
router.get('/users/all', addAccessToken, createProxyHandler('/api/users/all', 'get'));
router.get('/users/default', addAccessToken, createProxyHandler('/api/users/default', 'get'));
router.post('/users/add', addAccessToken, createProxyHandler('/api/users/add', 'post'));
router.post('/users/edit', addAccessToken, createProxyHandler('/api/users/edit', 'post'));
router.delete('/users/delete/:discord_id', addAccessToken, createProxyHandlerWithParams('/api/users/delete/:discord_id', 'delete'));

/*
    Role setters
*/
router.get('/roles/all', addAccessToken, createProxyHandler('/api/roles/all', 'get'));
router.get('/roles/default', addAccessToken, createProxyHandler('/api/roles/default', 'get'));
router.post('/roles/add', addAccessToken, createProxyHandler('/api/roles/add', 'post'));
router.post('/roles/edit', addAccessToken, createProxyHandler('/api/roles/edit', 'post'));
router.delete('/roles/delete/:role_name', addAccessToken, createProxyHandlerWithParams('/api/roles/delete/:role_name', 'delete'));


/*
    Server getters
*/
router.get('/get_server_config_item/:key', addAccessToken, createProxyHandlerWithParams('/api/get_server_config_item/:key', 'get'));
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
router.get('/get_global_config', addAccessToken, createProxyHandler('/api/get_global_config','get'));
router.get('/get_skipped_frame_data/:port', addAccessToken, createProxyHandlerWithParams('/api/get_skipped_frame_data/:port', 'get'));
/*
    Server setters
*/
router.post('/set_hon_data', addAccessToken, createProxyHandler('/api/set_hon_data', 'post'))

/*
    Server control
*/
router.post('/stop_server/:port', addAccessToken, createProxyHandlerWithParams('/api/stop_server/:port', 'post'));
router.post('/start_server/:port', addAccessToken, createProxyHandlerWithParams('/api/start_server/:port', 'post'));
router.post('/add_servers/:num', addAccessToken, createProxyHandlerWithParams('/api/add_servers/:num', 'post'));
router.post('/remove_servers/:num', addAccessToken, createProxyHandlerWithParams('/api/remove_servers/:num', 'post'));
router.post('/add_all_servers', addAccessToken, createProxyHandlerWithParams('/api/add_all_servers', 'post'));
router.post('/remove_all_servers', addAccessToken, createProxyHandlerWithParams('/api/remove_all_servers', 'post'));
router.get('/ping', addAccessToken, createProxyHandler('/api/ping', 'get'));

module.exports = router;