const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    description: { type: String, required: true },
    requirements: { type: String, required: true },
    salary: { type: String },
    location: { type: String },
    datePosted: { type: Date, default: Date.now },
    // Add more fields as needed (e.g., industry, employment type, etc.)
});

const Job = mongoose.model('Job', jobSchema);
module.exports = Job;
