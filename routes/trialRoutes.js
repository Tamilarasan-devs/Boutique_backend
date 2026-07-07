const express = require('express');
const router = express.Router();
const { getTrials, addTrial, updateTrialStatus, deleteTrial } = require('../controller/trialController');

router.get('/', getTrials);
router.post('/', addTrial);
router.put('/:id/status', updateTrialStatus);
router.delete('/:id', deleteTrial);

module.exports = router;
