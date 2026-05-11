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

// ── Custom Food ───────────────────────────────────────────────────────────────

// GET  /nhat-ky/mon-cua-toi  → Trang quản lý custom food
router.get('/nhat-ky/mon-cua-toi', diaryController.getMyCustomFoods);

// POST /nhat-ky/tao-mon      → Tạo custom food mới (AJAX JSON)
router.post('/nhat-ky/tao-mon', diaryController.createCustomFood);

// PUT  /nhat-ky/sua-mon/:id  → Sửa custom food (AJAX JSON)
router.put('/nhat-ky/sua-mon/:id', diaryController.updateCustomFood);

// DELETE /nhat-ky/xoa-mon/:id → Soft-delete custom food (AJAX JSON)
router.delete('/nhat-ky/xoa-mon/:id', diaryController.deleteCustomFood);

module.exports = router;

