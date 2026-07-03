const express = require('express');
const router = express.Router();
const { getLeads, addLead, updateLeadStatus, deleteLead } = require('../controller/leadController');

router.get('/', getLeads);
router.post('/', addLead);
router.put('/:id', updateLeadStatus);
router.delete('/:id', deleteLead);

module.exports = router;
