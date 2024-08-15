require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db'); // Database connection
const cors = require('cors');

const app = express();

// Connect Database
connectDB();

console.log("somwthing")
// Init Middleware
app.use(express.json({ extended: false }));
app.use(cors());

// Define Routes
app.use('/api/jobs', require('./routes/jobs')); // Job routes
app.use('/api/companies', require('./routes/companies')); // Company routes
app.use('/api/users', require('./routes/users')); // User routes

app.get('/', (req, res) => res.send('API Running'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
