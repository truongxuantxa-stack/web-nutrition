'use strict';

const router = require('express').Router();
const ctrl   = require('../../controllers/api/diary.controller');

// Nhật ký theo ngày
router.get('/',                ctrl.getDiary);

// Entries
router.post('/entries',        ctrl.addEntry);
router.delete('/entries/:id',  ctrl.deleteEntry);

// Food search
router.get('/foods/search',    ctrl.searchFood);

// Custom foods
router.get('/foods/my',        ctrl.getMyCustomFoods);
router.post('/foods',          ctrl.createCustomFood);
router.put('/foods/:id',       ctrl.updateCustomFood);
router.delete('/foods/:id',    ctrl.deleteCustomFood);

module.exports = router;
