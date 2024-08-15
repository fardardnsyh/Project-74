const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController'); // Your controller
const auth = require('../middleware/auth')

// Public Routes
router.get('/', jobController.getAllJobs);         // Get all jobs
router.get('/search', jobController.searchJobs);   // Search for jobs
router.get('/:jobId', jobController.getJobById);    // Get job by ID
router.get('/:jobId/similar', jobController.getSimilarJobs); // Get similar jobs 
// router.get('/featured', jobController.getFeaturedJobs); // Get featured jobs (optional)

// Private Routes (Protected by Authentication)
router.post('/', auth, jobController.createJob);      // Create a new job
router.put('/:jobId', auth, jobController.updateJob); // Update job
router.delete('/:jobId', auth, jobController.deleteJob); // Delete job

// ...other job routes (e.g., GET /:id, PUT /:id, DELETE /:id)

module.exports = router;
