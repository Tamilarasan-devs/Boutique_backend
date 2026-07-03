const express = require('express');
const router = express.Router();
const {
  register,
  login,
  createUser,
  getMe,
  getUsers,
  updateUser,
  deleteUser,
  checkOwnerExists,
} = require('../controller/authController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.get('/check-owner', checkOwnerExists);

// Protected routes (require valid JWT)
router.get('/me', verifyToken, getMe);

// Owner-only routes
router.post('/create-user', verifyToken, requireRole('owner'), createUser);
router.get('/users', verifyToken, requireRole('owner'), getUsers);
router.put('/users/:id', verifyToken, requireRole('owner'), updateUser);
router.delete('/users/:id', verifyToken, requireRole('owner'), deleteUser);

module.exports = router;
