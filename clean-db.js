// clean-db.js
require('dotenv').config();
const mongoose = require('mongoose');
const Stock = require('./models/Stock');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');
    await Stock.deleteMany({}); // <-- removes all documents
    console.log('Database cleaned');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
