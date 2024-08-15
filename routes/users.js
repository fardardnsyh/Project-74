const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth')

// Public Routes
router.post('/', userController.registerUser);
router.post('/login', userController.loginUser);

// Private Routes (Protected by Authentication)
router.get('/:userId', auth, userController.getUserById);
router.get('/me', auth, userController.getCurrentUserProfile); // Get current user profile
router.put('/me', auth, userController.updateUserProfile); // Update user profile
router.get('/me/applied-jobs', auth, userController.getUserAppliedJobs); // Get applied jobs
router.put('/jobs/:id/apply', auth, userController.applyToJob); // Apply to job
router.delete('/jobs/:id/withdraw', auth, userController.withdrawApplication); // Withdraw application
router.delete('/me', auth, userController.deleteUser);

module.exports = router;
