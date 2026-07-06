const express = require('express');
const router = express.Router();
const { sseEvents, getFollowups, addFollowup, updateFollowupStatus, updateFollowup } = require('../controller/followupController');

// @route   GET /api/followups/events
router.get('/events', sseEvents);

// @route   GET /api/followups
router.get('/', getFollowups);

// @route   POST /api/followups
router.post('/', addFollowup);

// @route   PUT /api/followups/:id/status
router.put('/:id/status', updateFollowupStatus);

// @route   PUT /api/followups/:id
router.put('/:id', updateFollowup);

module.exports = router;
