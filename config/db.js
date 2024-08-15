const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables
const MongoURL = process.env.MONGO_URI

const connectDB = async () => {
    try {
        await mongoose.connect(MongoURL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected...');
    } catch (err) {
        console.error(err.message);
        process.exit(1); // Exit process with failure
    }
};

module.exports = connectDB;
