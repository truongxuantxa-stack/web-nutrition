'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// routes/weight.routes.js
// ═══════════════════════════════════════════════════════════════════════════════

const express = require('express');
const router  = express.Router();
const weightController = require('../controllers/weight.controller');

// GET    /can-nang           → Trang theo dõi cân nặng
router.get('/can-nang', weightController.getWeightPage);

// POST   /can-nang/them      → Thêm/cập nhật log cân nặng
router.post('/can-nang/them', weightController.addWeight);

// DELETE /can-nang/xoa/:id  → Xóa log cân nặng (AJAX JSON)
router.delete('/can-nang/xoa/:id', weightController.deleteWeight);

module.exports = router;
