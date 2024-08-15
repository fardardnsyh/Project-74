const Job = require('../models/jobSchema'); // Import the Job model

// Get all jobs
const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find().populate('company'); // Populate company data
    res.json(jobs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get job by ID
// @route   GET /api/jobs/:jobId
// @access  Public
const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId).populate('company');

    if (!job) {
      return res.status(404).json({ msg: 'Job not found' });
    }

    res.json(job);
  } catch (err) {
    console.error(err.message);
    // Check if the error is a CastError (invalid ObjectId)
    if (err.name === 'CastError') {
      return res.status(400).json({ msg: 'Invalid job ID' });
    }
    res.status(500).send('Server Error');
  }
};


// @desc    Create a new job
// @route   POST /api/jobs
// @access  Private (Company)
const createJob = async (req, res) => {
  try {
    // 1. Authentication & Authorization Check
    if (!req.user) { // Check if user is authenticated
      return res.status(401).json({ msg: 'Not authorized - no token' });
    }
    console.log(req.user.role);
    console.log(req.user);

    if (req.user.role !== 'company' || !req.user.companyId) {
      return res.status(403).json({ msg: 'Only companies can create jobs' });
    }

    // 2. Input Validation (using Joi or similar - highly recommended)
    // const { error } = jobValidationSchema.validate(req.body);
    // if (error) {
    //   return res.status(400).json({ errors: error.details });
    // }

    // Or, basic validation without an external library:
    const {
      title,
      description,
      requirements,
      salary,
      location,
      // ...add more fields as needed (e.g., experienceLevel, tags)
    } = req.body;

    if (!title || !description || !requirements) { // Add more validation as needed
      return res.status(400).json({ msg: 'Please include all required fields: title, description, requirements' });
    }

    // 3. Create New Job Object
    const newJob = new Job({
      title,
      description,
      requirements,
      salary,
      location,
      company: req.user.companyId, // Use the company ID from the authenticated user's token
      // ...add more fields based on your Job schema
    });

    // 4. Save Job to Database
    const job = await newJob.save();

    // 5. Send Response (Success)
    res.status(201).json(job);
  } catch (err) {
    console.error(err.message);

    // 6. Error Handling
    if (err.name === 'ValidationError') {
      // Handle validation errors (e.g., missing required fields, invalid types)
      const errors = {};
      for (let field in err.errors) {
        errors[field] = err.errors[field].message;
      }
      return res.status(400).json({ errors });
    }

    // Handle other server errors (e.g., database connection error)
    res.status(500).send('Server Error');
  }
};

// @desc    Update job
// @route   PUT /api/jobs/:jobId
// @access  Private (Company)
const updateJob = async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const updatedJobData = req.body;

    // Check if job exists
    let job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ msg: 'Job not found' });
    }

    // Authorization Check: Ensure the job belongs to the authenticated company
    if (job.company.toString() !== req.user.companyId) { // Assuming req.user.companyId is set by auth middleware
      return res.status(401).json({ msg: 'Not authorized to update this job' });
    }

    // Update the job
    job = await Job.findByIdAndUpdate(jobId, { $set: updatedJobData }, { new: true, runValidators: true });
    res.json(job);
  } catch (err) {
    console.error(err.message);
    // Handle validation errors
    if (err.name === 'ValidationError') {
      return res.status(400).json({ errors: err.errors });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Delete job
// @route   DELETE /api/jobs/:jobId
// @access  Private (Company)
const deleteJob = async (req, res) => {
  try {
    const jobId = req.params.jobId;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ msg: 'Job not found' });
    }

    // Authorization Check: Ensure the job belongs to the authenticated company
    if (job.company.toString() !== req.user.companyId) {
      return res.status(401).json({ msg: 'Not authorized to delete this job' });
    }

    // Delete the job
    await job.remove();
    res.json({ msg: 'Job removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get jobs by company
// @route   GET /api/companies/:companyId/jobs
// @access  Public 
const getJobsByCompany = async (req, res) => {
  try {
    const companyId = req.params.companyId;

    // Find all jobs associated with the company ID
    const jobs = await Job.find({ company: companyId }).populate('company');

    if (!jobs || jobs.length === 0) {
      return res.status(404).json({ msg: 'No jobs found for this company' });
    }

    res.json(jobs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Search for jobs
// @route   GET /api/jobs/search
// @access  Public
const searchJobs = async (req, res) => {
  try {
    const { keyword, location, industry, fullTimeOnly } = req.query;

    // Build the search query
    const query = {};
    if (keyword) {
      query.title = { $regex: keyword, $options: 'i' }; // Case-insensitive search
      // You can search in other fields as well (e.g., description)
    }
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    if (industry) {
      query.industry = industry;
    }
    if (fullTimeOnly) {
      query.employmentType = 'Full-Time';
    }

    // Perform the search
    const jobs = await Job.find(query).populate('company');
    res.json(jobs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get similar jobs based on a job ID
// @route   GET /api/jobs/:jobId/similar
// @access  Public
const getSimilarJobs = async (req, res) => {
  try {
    const jobId = req.params.jobId;

    // Fetch the reference job
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ msg: 'Job not found' });
    }

    // Extract relevant fields for comparison (title, description, etc.)
    const referenceText = `${job.title} ${job.description} ${job.requirements}`;

    // Find similar jobs
    const similarJobs = await Job.find({
      _id: { $ne: jobId }, // Exclude the reference job itself
    }).select('title description requirements company'); // Select fields for comparison

    // Calculate similarity scores (you'll need a similarity function)
    similarJobs.forEach(similarJob => {
      const similarText = `${similarJob.title} ${similarJob.description} ${similarJob.requirements}`;
      similarJob.similarityScore = calculateSimilarity(referenceText, similarText); // Placeholder
    });

    // Sort by similarity score (descending) and limit results (e.g., top 5)
    similarJobs.sort((a, b) => b.similarityScore - a.similarityScore);
    const topSimilarJobs = similarJobs.slice(0, 5);

    res.json(topSimilarJobs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Placeholder similarity function (replace with a real implementation)
function calculateSimilarity(text1, text2) {
  // Implement your similarity algorithm here (e.g., cosine similarity, Jaccard similarity)
  // This is a very basic implementation for demonstration purposes
  const words1 = text1.toLowerCase().split(/\W+/);
  const words2 = text2.toLowerCase().split(/\W+/);
  const intersection = words1.filter(word => words2.includes(word));
  return intersection.length / Math.max(words1.length, words2.length);
}


// ... other job controller functions (e.g., getJobById, updateJob, deleteJob)
module.exports = {
  updateJob,
  deleteJob,
  getJobsByCompany,
  getJobById,
  searchJobs,
  getSimilarJobs,
  getAllJobs,
  createJob,
  // ... other functions
};
