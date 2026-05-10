'use strict';

const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/exercise.controller');

// ─── Trang nhật ký luyện tập ──────────────────────────────────────────────────
router.get ('/luyen-tap',           ctrl.getExercise);
router.post('/luyen-tap/them',      ctrl.addExercise);
router.delete('/luyen-tap/xoa/:id', ctrl.deleteExercise);

// ─── API JSON (dùng cho Dashboard) ───────────────────────────────────────────
router.get('/luyen-tap/api/hom-nay', ctrl.getTodaySummary);

module.exports = router;
