'use strict';

const router = require('express').Router();

// Auth routes: /api/v1/auth/*
router.use('/auth', require('./auth.routes'));

// Bước 4 sẽ thêm dần khi React SPA hoàn thiện:
// const { requireAuthApi } = require('../../middlewares/auth.middleware');
// router.use('/diary', requireAuthApi, require('./diary.routes'));
// router.use('/weight', requireAuthApi, require('./weight.routes'));

module.exports = router;
