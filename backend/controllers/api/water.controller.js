'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// controllers/api/water.controller.js
// Forward các action water đã trả JSON sẵn + thêm GET /api/v1/water
// ═══════════════════════════════════════════════════════════════════════════════

const waterCtrl = require('../water.controller');

// ─── POST /api/v1/water ──────────────────────────────────────────────────────
exports.addWater = waterCtrl.addWater;

// ─── DELETE /api/v1/water/:id ────────────────────────────────────────────────
exports.deleteWater = waterCtrl.deleteWater;

// ─── PUT /api/v1/water/goal ──────────────────────────────────────────────────
exports.updateWaterGoal = waterCtrl.updateWaterGoal;
