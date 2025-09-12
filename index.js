// index.js

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const recipeRoutes = require('./routes/recipes'); // Import the recipes routes

const app = express();
app.use(express.json());  // Enable JSON parsing

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);  // Exit the app if MongoDB connection fails
  });

// Use routes
app.use('/api/recipes', recipeRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('Node.js is working.');
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err);  // Log the error
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
