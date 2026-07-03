const express = require('express');
const router = express.Router();
const {
  getAttendance,
  getAttendanceByDate,
  markAttendance,
  bulkMarkAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceSummary
} = require('../controller/attendanceController');

// @route   GET /api/attendance/summary
// @desc    Get monthly attendance summary per employee (?month=YYYY-MM&employee_id=)
router.get('/summary', getAttendanceSummary);

// @route   GET /api/attendance/by-date
// @desc    Get all employees with attendance status for a specific date (?date=YYYY-MM-DD)
router.get('/by-date', getAttendanceByDate);

// @route   GET /api/attendance
// @desc    Get attendance records (?date=&employee_id=&status=&page=&limit=)
router.get('/', getAttendance);

// @route   POST /api/attendance
// @desc    Mark attendance for a single employee (upsert)
router.post('/', markAttendance);

// @route   POST /api/attendance/bulk
// @desc    Bulk mark attendance for all active employees
router.post('/bulk', bulkMarkAttendance);

// @route   PUT /api/attendance/:id
// @desc    Update an attendance record
router.put('/:id', updateAttendance);

// @route   DELETE /api/attendance/:id
// @desc    Delete an attendance record
router.delete('/:id', deleteAttendance);

module.exports = router;
