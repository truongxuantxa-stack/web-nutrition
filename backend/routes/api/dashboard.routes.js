'use strict';

const router = require('express').Router();
const ctrl   = require('../../controllers/api/dashboard.controller');

// GET /api/v1/dashboard?date=YYYY-MM-DD
router.get('/', ctrl.getDashboard);

module.exports = router;
