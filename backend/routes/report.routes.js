'use strict';

const express = require('express');
const router  = express.Router();
const reportController = require('../controllers/report.controller');

// GET /api/report/pdf?range=week|month
router.get('/pdf', reportController.downloadReport);

module.exports = router;
