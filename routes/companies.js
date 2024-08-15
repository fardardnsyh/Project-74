const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const auth = require('../middleware/auth')

// Public Routes
router.get('/', companyController.getAllCompanies);          // Get all companies
router.get('/:companyId/jobs', companyController.getCompanyJobListings); // Get company's job listings
router.get('/:companyId', companyController.getCompanyById); // Get company by ID (for job seekers)

// Private Routes (Protected by Authentication)
router.post('/', auth, companyController.createCompany);         // Create a new company
router.get('/me', auth, companyController.getCurrentCompanyProfile);  // Get current company profile
router.put('/me', auth, companyController.updateCompanyProfile);      // Update company profile
router.delete('/me', auth, companyController.deleteCompany);

module.exports = router;
