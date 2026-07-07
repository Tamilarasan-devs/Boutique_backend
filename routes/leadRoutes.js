const express = require('express');
const router = express.Router();
const { getLeads, addLead, updateLeadStatus, updateLead, deleteLead } = require('../controller/leadController');

router.get('/', getLeads);
router.post('/', addLead);
router.put('/:id', updateLeadStatus);
router.put('/:id/full', updateLead);
router.delete('/:id', deleteLead);

module.exports = router;
