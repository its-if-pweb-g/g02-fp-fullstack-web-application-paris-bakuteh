const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middleware to handle JSON requests
app.use(express.json());
app.use(cors());

// A simple route to test the server
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from the backend!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
