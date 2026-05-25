'use strict';

const router = require('express').Router();
const ctrl   = require('../../controllers/api/water.controller');

router.post('/',       ctrl.addWater);
router.delete('/:id',  ctrl.deleteWater);
router.put('/goal',    ctrl.updateWaterGoal);

module.exports = router;
