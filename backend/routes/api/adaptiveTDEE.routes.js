'use strict';

const router = require('express').Router();
const ctrl   = require('../../controllers/api/adaptiveTDEE.controller');

router.get('/status',      ctrl.getStatus);
// Tải toàn bộ lịch sử 12 tuần gần nhất
router.get('/history',     ctrl.getHistory);
// Kích hoạt tính toán thủ công cho tuần trước
router.post('/calculate',  ctrl.calculateNow);
// Bật/tắt trạng thái sử dụng Adaptive TDEE
router.put('/toggle',      ctrl.toggle);
// Bỏ qua tính toán tuần hiện tại
router.put('/skip-week',   ctrl.skipWeek);

module.exports = router;
