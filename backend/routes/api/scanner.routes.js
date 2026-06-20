'use strict';

const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const ctrl = require('../../controllers/api/scanner.controller');

// Rate limit riêng cho AI Vision — 5 req/phút/user
// Gemini free tier giới hạn 15 RPM, dùng 5/user để an toàn
const aiVisionLimiter = rateLimit({
    windowMs: 60 * 1000,  // 1 phút
    max: 5,
    keyGenerator: (req) => String(req.user.id),  // Limit per userId, không phải per IP
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Bạn đã quét quá nhiều. Vui lòng chờ 1 phút rồi thử lại.',
        });
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Các route đều yêu cầu auth (requireAuthApi được apply ở routes/api/index.js)
router.post('/barcode-lookup',          ctrl.barcodeLookup);
router.post('/ai-vision',               aiVisionLimiter, ctrl.aiVision);
router.post('/decode-barcode-image',     aiVisionLimiter, ctrl.decodeBarcodeImage);
router.post('/confirm-contribution',     ctrl.confirmContribution);
router.post('/report',                   ctrl.reportProduct);

module.exports = router;
