// server/src/routes/userRoutes.js
const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

router.post('/register', userController.createUser);

router.post('/authenticate', userController.authenticateUser);

module.exports = router;
