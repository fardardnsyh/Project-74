const Company = require('../models/companySchema');
const User = require('../models/userSchema');
const jwt = require('jsonwebtoken'); // Import the jsonwebtoken module

// Get company by ID
const getCompanyById = async (req, res) => {
  try {
    const companyId = req.params.companyId;
    const company = await Company.findById(companyId);

    if (!company) {
      return res.status(404).json({ msg: 'Company not found' });
    }

    res.json(company);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Get all companies
const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find();
    res.json(companies);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};


// @desc    Create a new company
// @route   POST /api/companies
// @access  Private (User - with potential for role-based restriction)
const createCompany = async (req, res) => {
  try {
    // 1. Authentication & Authorization
    if (!req.user) {
      return res.status(401).json({ msg: 'Not authorized - no token' });
    }

    if (req.user.role !== 'company') {
      return res.status(403).json({ msg: 'Only companies can create companies' });
    }

    // 2. Input Validation
    // Using Joi (or a similar library):
    // const { error } = companyValidationSchema.validate(req.body);
    // if (error) return res.status(400).json({ errors: error.details });

    // Basic validation without an external library:
    const { name, description, industry, website, logo } = req.body;
    if (!name || !description || !industry || !website) {
      return res.status(400).json({ msg: 'Please include all required fields' });
    }

    // 3. Check if User Already Has a Company
    const doesUserHaveCompany = await Company.findOne({ createdBy: req.user.id });
    if (doesUserHaveCompany) {
      return res.status(400).json({ msg: 'You already have a company profile' });
    }

    // 4. Check for Duplicate Company Name
    const existingCompany = await Company.findOne({ name });
    if (existingCompany) {
      return res.status(400).json({ msg: 'Company name already exists' });
    }

    // 5. Create New Company
    const newCompany = new Company({
      name,
      description,
      industry,
      website,
      logo,
      createdBy: req.user.id
    });

    // 6. Update User's companyId and generate new token
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { companyId: newCompany._id },
      { new: true }
    );

    // Generate new JWT token
    const payload = {
      user: {
        id: updatedUser.id,
        role: updatedUser.role,
        companyId: updatedUser.companyId,
      },
    };
    const newToken = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
    );

    // 6. Save Company
    const savedCompany = await newCompany.save();

    // 7. Success Response
    res.status(201).json({
      company: savedCompany,
      token: newToken   // Also send the updated token
    });
  } catch (err) {
    console.error(err.message);

    // 8. Error Handling
    if (err.name === 'ValidationError') {
      return res.status(400).json({ errors: err.errors });
    } else {
      res.status(500).send('Server Error');
    }
  }
};

// @desc    Get current company profile
// @route   GET /api/companies/me
// @access  Private (Companies)
const getCurrentCompanyProfile = async (req, res) => {
  try {
    const company = await Company.findById(req.user.companyId); // Assuming you have the company ID in req.user

    if (!company) {
      return res.status(404).json({ msg: 'Company not found' });
    }

    res.json(company);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Update company profile
// @route   PUT /api/companies/me
// @access  Private (Companies)
const updateCompanyProfile = async (req, res) => {
  try {
    const { name, description, industry, website, logo } = req.body; // Fields to update

    // Build the update object (only include fields that are present in the request)
    const updateFields = {};
    if (name) updateFields.name = name;
    if (description) updateFields.description = description;
    if (industry) updateFields.industry = industry;
    if (website) updateFields.website = website;
    if (logo) updateFields.logo = logo;

    // Update the company document
    let company = await Company.findByIdAndUpdate(
      req.user.companyId, // Assuming company ID is in req.user
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!company) {
      return res.status(404).json({ msg: 'Company not found' });
    }

    res.json(company);
  } catch (err) {
    console.error(err.message);
    // Handle validation errors (if applicable)
    if (err.name === 'ValidationError') {
      const errors = {};
      for (let field in err.errors) {
        errors[field] = err.errors[field].message;
      }
      return res.status(400).json({ errors });
    }

    res.status(500).send('Server Error');
  }
};

// @desc    Get all job listings for a company
// @route   GET /api/companies/:companyId/jobs
// @access  Public 
const getCompanyJobListings = async (req, res) => {
  try {
    const companyId = req.params.companyId; // Get company ID from the URL parameter

    // Check if company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ msg: 'Company not found' });
    }

    // Find all jobs posted by this company
    const jobs = await Job.find({ company: companyId });

    res.json(jobs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Delete company
// @route   DELETE /api/companies/me
// @access  Private (Company)
const deleteCompany = async (req, res) => {
  try {
    // Find and remove the company
    const company = await Company.findByIdAndRemove(req.user.companyId);

    if (!company) {
      return res.status(404).json({ msg: 'Company not found' });
    }

    // Optionally, you might want to delete associated data here (e.g., job postings)

    res.json({ msg: 'Company deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// ... other company controller functions

module.exports = {
  getCompanyById,
  getAllCompanies,
  createCompany,
  getCurrentCompanyProfile,
  updateCompanyProfile,
  getCompanyJobListings,
  deleteCompany,
  // ... other functions
};
