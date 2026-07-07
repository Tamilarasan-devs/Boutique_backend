const express = require('express');
const router = express.Router();
const {
  getSalesReport,
  getInventoryReport,
  getFinanceReport,
  getCustomersReport,
  exportReport
} = require('../controller/reportController');

// @route   GET /api/reports/sales
router.get('/sales', getSalesReport);

// @route   GET /api/reports/inventory
router.get('/inventory', getInventoryReport);

// @route   GET /api/reports/finance
router.get('/finance', getFinanceReport);

// @route   GET /api/reports/customers
router.get('/customers', getCustomersReport);

// @route   GET /api/reports/:type/export
router.get('/:type/export', exportReport);

module.exports = router;
