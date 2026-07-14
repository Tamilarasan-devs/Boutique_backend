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

router.get('/roles', verifyToken, settingsController.getRoles);
router.post('/roles', verifyToken, requireRole('owner'), settingsController.createRole);
router.put('/roles/:role', verifyToken, requireRole('owner'), settingsController.updateRolePermissions);
router.delete('/roles/:role', verifyToken, requireRole('owner'), settingsController.deleteRole);

router.get('/roles-test', (req, res, next) => {
  req.user = { boutique_id: 15 }; // Assuming boutique_id 15 based on inspect_db output
  next();
}, settingsController.getRoles);

module.exports = router;
