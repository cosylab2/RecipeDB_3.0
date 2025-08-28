const express = require('express');
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Route
app.get('/', (req, res) => {
  res.send('Hello, Node.js app is running 🚀');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
