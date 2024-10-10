import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Create or join a session
app.post('/api/sessions', (req, res) => {
  const { sessionId, userId } = req.body;
  if (!sessions[sessionId]) {
    sessions[sessionId] = { users: [userId], answers: {} };
  } else if (!sessions[sessionId].users.includes(userId)) {
    sessions[sessionId].users.push(userId);
  }
  res.json({ sessionId, userId });
});

// Get questions
app.get('/api/questions', (req, res) => {
  res.json(questions);
});

// Submit an answer
app.post('/api/answers', (req, res) => {
  const { sessionId, userId, questionId, answer } = req.body;
  if (sessions[sessionId]) {
    if (!sessions[sessionId].answers[questionId]) {
      sessions[sessionId].answers[questionId] = {};
    }
    sessions[sessionId].answers[questionId][userId] = answer;
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

// Get results
app.get('/api/results/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  if (sessions[sessionId]) {
    res.json(sessions[sessionId].answers);
  } else {
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