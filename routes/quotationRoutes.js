const express = require('express');
const router = express.Router();
const { getQuotations, addQuotation, updateQuotationStatus, deleteQuotation } = require('../controller/quotationController');

router.get('/', getQuotations);
router.post('/', addQuotation);
router.put('/:id/status', updateQuotationStatus);
router.delete('/:id', deleteQuotation);

module.exports = router;
