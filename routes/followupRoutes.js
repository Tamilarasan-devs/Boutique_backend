const express = require('express');
const router = express.Router();
const { getFollowups, addFollowup, updateFollowupStatus } = require('../controller/followupController');

// @route   GET /api/followups
router.get('/', getFollowups);

// @route   POST /api/followups
router.post('/', addFollowup);

// @route   PUT /api/followups/:id/status
router.put('/:id/status', updateFollowupStatus);

module.exports = router;
