import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg;
const app = express();
const port = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(bodyParser.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'dist')));

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Initialize database
async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        users TEXT[]
      );
      CREATE TABLE IF NOT EXISTS answers (
        session_id TEXT,
        user_id TEXT,
        question_id INTEGER,
        answer INTEGER,
        PRIMARY KEY (session_id, user_id, question_id)
      );
    `);
  } finally {
    client.release();
  }
}

initDatabase().catch(console.error);

const questions = [
  { id: 1, text: 'Do you enjoy outdoor activities?', category: 'Lifestyle' },
  { id: 2, text: 'Are you a morning person?', category: 'Lifestyle' },
  { id: 3, text: 'Do you like to travel?', category: 'Interests' },
  { id: 4, text: 'Are you interested in politics?', category: 'Interests' },
  { id: 5, text: 'Do you enjoy cooking?', category: 'Hobbies' }
];

// Create or join a session
app.post('/api/sessions', async (req, res) => {
  const { sessionId, userId } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT * FROM sessions WHERE id = $1', [sessionId]);
    if (rows.length === 0) {
      await client.query('INSERT INTO sessions (id, users) VALUES ($1, $2)', [sessionId, [userId]]);
    } else {
      const users = rows[0].users;
      if (!users.includes(userId)) {
        users.push(userId);
        await client.query('UPDATE sessions SET users = $1 WHERE id = $2', [users, sessionId]);
      }
    }
    await client.query('COMMIT');
    res.json({ sessionId, userId });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in create or join session:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Get questions
app.get('/api/questions', (req, res) => {
  res.json(questions);
});

// Submit an answer
app.post('/api/answers', async (req, res) => {
  const { sessionId, userId, questionId, answer } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'INSERT INTO answers (session_id, user_id, question_id, answer) VALUES ($1, $2, $3, $4) ON CONFLICT (session_id, user_id, question_id) DO UPDATE SET answer = $4',
      [sessionId, userId, questionId, answer]
    );
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error submitting answer:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Get results
app.get('/api/results/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const client = await pool.connect();
  try {
    const { rows } = await client.query('SELECT * FROM answers WHERE session_id = $1', [sessionId]);
    const results = rows.reduce((acc, row) => {
      if (!acc[row.question_id]) {
        acc[row.question_id] = {};
      }
      acc[row.question_id][row.user_id] = row.answer;
      return acc;
    }, {});
    res.json(results);
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
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