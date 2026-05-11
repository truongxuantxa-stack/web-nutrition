'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// routes/water.routes.js
// ═══════════════════════════════════════════════════════════════════════════════

const express = require('express');
const router  = express.Router();
const waterController = require('../controllers/water.controller');

// POST   /nuoc/them        → Thêm log nước (AJAX JSON)
router.post('/nuoc/them', waterController.addWater);

// DELETE /nuoc/xoa/:id     → Xóa log nước (AJAX JSON)
router.delete('/nuoc/xoa/:id', waterController.deleteWater);

// PUT    /nuoc/muc-tieu    → Cập nhật mục tiêu nước (AJAX JSON)
router.put('/nuoc/muc-tieu', waterController.updateWaterGoal);

module.exports = router;
