const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

console.log('Initializing database connection...');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

console.log('Database connection initialized');

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'dist')));

// Create or join a session
app.post('/api/sessions', async (req, res) => {
  console.log('Received request to create or join session');
  const { sessionId, userId } = req.body;
  try {
    const client = await pool.connect();
    const result = await client.query(
      'INSERT INTO sessions (id, users) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET users = array_append(sessions.users, $3) WHERE NOT $3 = ANY(sessions.users) RETURNING *',
      [sessionId, [userId], userId]
    );
    client.release();
    console.log('Session created or joined successfully');
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating or joining session:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get questions
app.get('/api/questions', async (req, res) => {
  console.log('Received request for questions');
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM questions');
    client.release();
    console.log('Questions retrieved successfully');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching questions:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit an answer
app.post('/api/answers', async (req, res) => {
  console.log('Received request to submit answer');
  const { sessi