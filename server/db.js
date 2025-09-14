const mongoose = require('mongoose');
const winston = require('winston');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    winston.info('✅ MongoDB Atlas connected successfully');
  } catch (error) {
    winston.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
