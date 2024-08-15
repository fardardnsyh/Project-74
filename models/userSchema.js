const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['jobseeker', 'company'], default: 'jobseeker' },
    resume: { type: String }, // For job seekers
    appliedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }], // For job seekers
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: false // Make it optional
    },
    date: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);
module.exports = User;
