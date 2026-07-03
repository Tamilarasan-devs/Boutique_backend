const express = require('express');
const router = express.Router();
const { logEmail, getEmailLogs, getEmailStats, deleteEmailLog } = require('../controller/emailController');

// @route   GET /api/email/stats
// @desc    Get email sending statistics
router.get('/stats', getEmailStats);

// @route   GET /api/email/logs
// @desc    Get all email logs (?search=&status=&page=&limit=)
router.get('/logs', getEmailLogs);

// @route   POST /api/email/log
// @desc    Log a sent email (called after EmailJS sends)
router.post('/log', logEmail);

// @route   DELETE /api/email/logs/:id
// @desc    Delete an email log record
router.delete('/logs/:id', deleteEmailLog);

module.exports = router;
