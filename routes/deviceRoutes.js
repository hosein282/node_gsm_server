// src/routes/userRoutes.js
const express = require('express');
const deviceController = require('../controllers/deviceController');

const router = express.Router();

router.post('/', deviceController.createDevice);
router.get('/', deviceController.getDevices);


module.exports = router;
