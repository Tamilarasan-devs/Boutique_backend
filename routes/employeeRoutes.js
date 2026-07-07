const express = require('express');
const router = express.Router();
const {
  getEmployees,
  getEmployeeById,
  addEmployee,
  updateEmployee,
  deleteEmployee
} = require('../controller/employeeController');

// @route   GET /api/employees
// @desc    Get all employees (supports ?search=&role=&status=&page=&limit=)
router.get('/', getEmployees);

// @route   POST /api/employees
// @desc    Add a new employee
router.post('/', addEmployee);

// @route   GET /api/employees/:id
// @desc    Get a single employee by ID
router.get('/:id', getEmployeeById);

// @route   PUT /api/employees/:id
// @desc    Update an employee
router.put('/:id', updateEmployee);

// @route   DELETE /api/employees/:id
// @desc    Delete an employee
router.delete('/:id', deleteEmployee);

module.exports = router;
