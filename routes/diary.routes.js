'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// routes/diary.routes.js
// ═══════════════════════════════════════════════════════════════════════════════

const express = require('express');
const router  = express.Router();
const diaryController = require('../controllers/diary.controller');

// GET  /nhat-ky              → Trang nhật ký (theo ngày)
router.get('/nhat-ky', diaryController.getDiary);

// POST /nhat-ky/them         → Thêm món ăn vào nhật ký (AJAX JSON)
router.post('/nhat-ky/them', diaryController.addEntry);

// DELETE /nhat-ky/xoa/:id   → Xóa mục nhật ký (AJAX JSON)
router.delete('/nhat-ky/xoa/:id', diaryController.deleteEntry);

// GET  /nhat-ky/tim-mon      → Tìm kiếm món ăn (AJAX JSON)
router.get('/nhat-ky/tim-mon', diaryController.searchFood);

module.exports = router;
