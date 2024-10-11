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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// API routes
app.get('/api/questions', async (req, res, next) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM questions');
    client.release();
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

app.post('/api/sessions', async (req, res, next) => {
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
    next(err);
  }
});

app.post('/api/answers', async (req, res, next) => {
  const { sessionId, userId, questionId, answer } = req.body;
  try {
    const client = await pool.connect();
    await client.query(
      'INSERT INTO answers (session_id, user_id, question_id, answer) VALUES ($1, $2, $3, $4)',
      [sessionId, userId, questionId, answer]
    );
    client.release();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

app.get('/api/results/:sessionId', async (req, res, next) => {
  const { sessionId } = req.params;
  try {
    const client = await pool.connect();
    const result = await client.query(
      'SELECT question_id, user_id, answer FROM answers WHERE session_id = $1',
      [sessionId]
    );
    client.release();
    
    const results = result.rows.reduce((acc, row) => {
      if (!acc[row.question_id]) {
        acc[row.question_id] = {};
      }
      acc[row.question_id][row.user_id] = row.answer;
      return acc;
    }, {});
    
    res.json(results);
  } catch (err) {
    next(err);
  }
});

// Category routes
app.get('/api/categories', async (req, res, next) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM categories');
    client.release();
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

app.post('/api/categories', async (req, res, next) => {
  const { name } = req.body;
  try {
    const client = await pool.connect();
    const result = await client.query(
      'INSERT INTO categories (name) VALUES ($1) RETURNING *',
      [name]
    );
    client.release();
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

app.put('/api/categories/:id', async (req, res, next) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    const client = await pool.connect();
    const result = await client.query(
      'UPDATE categories SET name = $1 WHERE id = $2 RETURNING *',
      [name, id]
    );
    client.release();
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Category not found' });
    } else {
      res.json(result.rows[0]);
    }
  } catch (err) {
    next(err);
  }
});

app.delete('/api/categories/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const client = await pool.connect();
    await client.query('DELETE FROM categories WHERE id = $1', [id]);
    client.release();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});