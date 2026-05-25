'use strict';

const router = require('express').Router();
const ctrl   = require('../../controllers/report.controller');

// GET /api/v1/report/pdf?range=week|month -> Stream PDF trực tiếp
router.get('/pdf', ctrl.downloadReport);

module.exports = router;
