'use strict';

const router = require('express').Router();
const ctrl   = require('../../controllers/api/weight.controller');

router.get('/',      ctrl.getWeight);
router.post('/',     ctrl.addWeight);
router.delete('/:id', ctrl.deleteWeight);

module.exports = router;
