const express = require('express');
const router = express.Router();
const { 
  addCustomer, 
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer
} = require('../controller/customerController');

// @route   POST /api/customers
// @desc    Add a new customer
router.post('/', addCustomer);

// @route   GET /api/customers
// @desc    Get all customers (supports optional query params page, limit, search)
router.get('/', getCustomers);

// @route   GET /api/customers/:id
// @desc    Get details of a specific customer
router.get('/:id', getCustomerById);

// @route   PUT /api/customers/:id
// @desc    Update a customer's profile
router.put('/:id', updateCustomer);

// @route   DELETE /api/customers/:id
// @desc    Delete a customer
router.delete('/:id', deleteCustomer);

module.exports = router;

