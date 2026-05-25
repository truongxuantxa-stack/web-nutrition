'use strict';

const router = require('express').Router();
const ctrl   = require('../../controllers/api/exercise.controller');

router.get('/sports',  ctrl.getSports);
router.get('/',        ctrl.getExercise);
router.post('/',       ctrl.addExercise);
router.delete('/:id',  ctrl.deleteExercise);

module.exports = router;
