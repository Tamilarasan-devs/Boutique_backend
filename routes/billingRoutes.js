const express = require('express');
const router = express.Router();
const {
    sseEvents,
    getInvoices,
    getInvoiceById,
    createInvoice,
    updateInvoiceStatus,
    deleteInvoice,
    getPayments,
    recordPayment
} = require('../controller/billingController');

// Real-time Event Stream (SSE)
router.get('/events', sseEvents);

// Invoices Routes
router.get('/invoices', getInvoices);
router.post('/invoices', createInvoice);
router.get('/invoices/:id', getInvoiceById);
router.put('/invoices/:id', updateInvoiceStatus);
router.delete('/invoices/:id', deleteInvoice);

// Payments Routes
router.get('/payments', getPayments);
router.post('/payments', recordPayment);

module.exports = router;
