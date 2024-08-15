const User = require('../models/userSchema');
const Job = require('../models/jobSchema');
const bcrypt = require('bcryptjs'); // For password hashing
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
// @desc    Register user
// @route   POST /api/users
// @access  Public
const registerUser = async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        // Check if user exists
        let user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
        }

        user = new User({
            name,
            email,
            password,
            role,
            companyId: null,
        });

        // Encrypt password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        res.json({ msg: 'User registered successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};


// @desc    Login user
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
        }
        console.log(user);
        // Create JWT payload
        const payload = {
            user: {
                id: user.id,
                role: user.role,
                companyId: user.companyId
                // Add any other necessary user data to the payload here if needed
            }
        };
        console.log(payload);
        // Sign the token (replace 'your_secret_key' with the actual secret in your .env file)
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: 3600 }, // Token expires in 3600 seconds (1 hour)
            (err, token) => {
                if (err) throw err;
                res.json({ token }); // Send the token in the response
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get user by ID
// @route   GET /api/users/:userId
// @access  Private (Admin or self) // Only admins or the user themselves can view a user's profile
const getUserById = async (req, res) => {
    try {
        // const userId = req.params.userId;
        const userId = new mongoose.Types.ObjectId(req.params.userId);

        // Check if the logged-in user is an admin or trying to access their own profile
        if (req.user.role !== 'company' && req.user.id !== userId) {
            return res.status(403).json({ msg: 'Not authorized to view this profile' });
        }

        const user = await User.findById(userId).select('-password');

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
const getCurrentUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update user profile
// @route   PUT /api/users/me
// @access  Private
const updateUserProfile = async (req, res) => {
    try {
        const { name, email, resume, skills } = req.body; // Fields you want to update

        // Build the update object
        const updateFields = {};
        if (name) updateFields.name = name;
        if (email) updateFields.email = email;
        if (resume) updateFields.resume = resume;
        // ... Add other fields as needed (e.g., skills, experience, etc.)

        // Update the user document
        let user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updateFields }, // Use $set to update only specified fields
            { new: true, runValidators: true } // Return the updated document, run validation
        ).select('-password'); // Exclude password from the response

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        console.error(err.message);
        // Handle validation errors if needed (e.g., duplicate email)
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

// @desc    Get applied jobs for the current user
// @route   GET /api/users/me/applied-jobs
// @access  Private
const getUserAppliedJobs = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('appliedJobs')
            .populate({
                path: 'appliedJobs',
                populate: {
                    path: 'company', // Populate company details for each job
                    model: 'Company'
                }
            });

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json(user.appliedJobs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Apply to a job
// @route   PUT /api/jobs/:id/apply
// @access  Private (Job Seekers)
const applyToJob = async (req, res) => {
    try {
        const jobId = req.params.id;
        const userId = req.user.id; // Assuming you have authentication middleware set up

        // Find the job
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ msg: 'Job not found' });
        }

        // Check if the user has already applied
        const user = await User.findById(userId);
        if (user.appliedJobs.includes(jobId)) {
            return res.status(400).json({ msg: 'You have already applied to this job' });
        }

        // Add the job to the user's appliedJobs array
        user.appliedJobs.push(jobId);
        await user.save();

        res.json({ msg: 'Successfully applied to the job' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Withdraw job application
// @route   DELETE /api/jobs/:id/withdraw
// @access  Private (Job Seekers)
const withdrawApplication = async (req, res) => {
    try {
        const jobId = req.params.id;
        const userId = req.user.id; // Assuming you have authentication middleware set up

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Check if the user has applied to the job
        const index = user.appliedJobs.indexOf(jobId);
        if (index === -1) {
            return res.status(400).json({ msg: 'You have not applied to this job' });
        }

        // Remove the job from the user's appliedJobs array
        user.appliedJobs.splice(index, 1);
        await user.save();

        res.json({ msg: 'Application withdrawn successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Delete user
// @route   DELETE /api/users/me
// @access  Private
const deleteUser = async (req, res) => {
    try {
        // Find and remove the user
        const user = await User.findByIdAndRemove(req.user.id);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Optionally, you might want to delete associated data here (e.g., job applications)

        res.json({ msg: 'User deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    registerUser,
    loginUser,
    getUserById,
    getCurrentUserProfile,
    updateUserProfile,
    getUserAppliedJobs,
    applyToJob,
    withdrawApplication,
    deleteUser,
    // ...other user-related functions
};
