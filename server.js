const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Improved logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

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

// Create or join a session
app.post('/api/sessions', (req, res) => {
  console.log('Received request to create/join session:', req.body);
  const { sessionId, userId } = req.body;
  if (!sessions[sessionId]) {
    sessions[sessionId] = { users: [userId], answers: {} };
    console.log(`Created new session: ${sessionId}`);
  } else if (!sessions[sessionId].users.includes(userId)) {
    sessions[sessionId].users.push(userId);
    console.log(`User ${userId} joined session ${sessionId}`);
  }
  res.json({ sessionId, userId });
});

// Get questions
app.get('/api/questions', (req, res) => {
  console.log('Sending questions:', questions);
  res.json(questions);
});

// Submit an answer
app.post('/api/answers', (req, res) => {
  console.log('Received answer:', req.body);
  const { sessionId, userId, questionId, answer } = req.body;
  if (sessions[sessionId]) {
    if (!sessions[sessionId].answers[questionId]) {
      sessions[sessionId].answers[questionId] = {};
    }
    sessions[sessionId].answers[questionId][userId] = answer;
    console.log(`Answer recorded for session ${sessionId}, question ${questionId}`);
    res.json({ success: true });
  } else {
    console.log(`Session not found: ${sessionId}`);
    res.status(404).json({ error: 'Session not found' });
  }
});

// Get results
app.get('/api/results/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  console.log(`Fetching results for session: ${sessionId}`);
  if (sessions[sessionId]) {
    res.json(sessions[sessionId].answers);
  } else {
    console.log(`Session not found: ${sessionId}`);
    res.status(404).json({ error: 'Session not found' });
  }
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});