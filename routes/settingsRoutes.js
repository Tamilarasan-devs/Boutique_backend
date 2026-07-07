const express = require('express');
const router = express.Router();
const settingsController = require('../controller/settingsController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Public or Authenticated (Everyone needs to read company info to see the logo)
router.get('/company', settingsController.getCompanyProfile);

// Only Owner and Manager can update company profile
router.put(
  '/company', 
  verifyToken, 
  requireRole('owner', 'manager'), 
  settingsController.updateCompanyProfile
);

module.exports = router;
