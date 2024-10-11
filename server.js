import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

app.use(express.json());
app.use(express.static(join(__dirname, 'dist')));

// API routes
app.post('/api/sessions', async (req, res) => {
  const { sessionId, userId } = req.body;
  try {
    const client = await pool.connect();
    const result = await client.query(
      'INSERT INTO sessions (id, users) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET users = array_append(sessions.users, $3) WHERE NOT $3 = ANY(sessions.users) RETURNING *',
      [sessionId, [userId], userId]
    );
    client.release();
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating or joining session:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/questions', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM questions');
    client.release();
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching questions:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/answers', async (req, res) => {
  const { sessionId, userId, questionId, answer, handle } = req.body;
  try {
    const client = await pool.connect();
    await client.query(
      'INSERT INTO answers (session_id, user_id, question_id, answer, user_handle) VALUES ($1, $2, $3, $4, $5)',
      [sessionId, userId, questionId, answer, handle]
    );
    client.release();
    res.json({ success: true });
  } catch (err) {
    console.error('Error submitting answer:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/results/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  try {
    const client = await pool.connect();
    const result = await client.query(
      'SELECT question_id, user_id, answer, user_handle FROM answers WHERE session_id = $1',
      [sessionId]
    );
    client.release();
    
    const results = result.rows.reduce((acc, row) => {
      if (!acc[row.question_id]) {
        acc[row.question_id] = {};
      }
      acc[row.question_id][row.user_id] = { answer: row.answer, userHandle: row.user_handle };
      return acc;
    }, {});
    
    res.json(results);
  } catch (err) {
    console.error('Error fetching results:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});