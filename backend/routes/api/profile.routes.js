'use strict';

const router = require('express').Router();
const ctrl   = require('../../controllers/api/profile.controller');

router.get('/',          ctrl.getProfile);
router.put('/',          ctrl.updateProfile);
router.put('/macros',    ctrl.updateMacros);
router.get('/allergies', ctrl.getAllergies);
router.put('/allergies', ctrl.updateAllergies);
router.post('/onboarding', ctrl.onboardUser);

module.exports = router;
