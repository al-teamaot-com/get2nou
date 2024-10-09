const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'dist')));

// In-memory data store
const sessions = {};
const questions = [
  { id: 1, text: 'Do you enjoy outdoor activities?', category: 'Lifestyle' },
  { id: 2, text: 'Are you a morning person?', category: 'Lifestyle' },
  { id: 3, text: 'Do you like to travel?', category: 'Interests' },
  { id: 4, text: 'Are you interested in politics?', category: 'Interests' },
  { id: 5, text: 'Do you enjoy cooking?', category: 'Hobbies' }
];

// API routes
app.post('/api/sessions', (req, res) => {
  // ... (existing code)
});

app.get('/api/questions', (req, res) => {
  // ... (existing code)
});

app.post('/api/answers', (req, res) => {
  // ... (existing code)
});

app.get('/api/results/:sessionId', (req, res) => {
  // ... (existing code)
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});