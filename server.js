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
    const result = await client.query(`
      SELECT q.id, q.text, ARRAY_AGG(c.name) as categories
      FROM questions q
      LEFT JOIN question_categories qc ON q.id = qc.question_id
      LEFT JOIN categories c ON qc.category_id = c.id
      GROUP BY q.id, q.text
    `);
    client.release();
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching questions:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM categories');
    client.release();
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/answers', async (req, res) => {
  const { sessionId, userId, questionId, answer } = req.body;
  try {
    const client = await pool.connect();
    await client.query(
      'INSERT INTO answers (session_id, user_id, question_id, answer) VALUES ($1, $2, $3, $4) ON CONFLICT (session_id, user_id, question_id) DO UPDATE SET answer = $4',
      [sessionId, userId, questionId, answer]
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
    console.error('Error fetching results:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/questions', async (req, res) => {
  const { text, categories } = req.body;
  try {
    const client = await pool.connect();
    await client.query('BEGIN');
    const questionResult = await client.query(
      'INSERT INTO questions (text) VALUES ($1) RETURNING id',
      [text]
    );
    const questionId = questionResult.rows[0].id;

    for (const categoryName of categories) {
      const categoryResult = await client.query(
        'SELECT id FROM categories WHERE name = $1',
        [categoryName]
      );
      if (categoryResult.rows.length > 0) {
        const categoryId = categoryResult.rows[0].id;
        await client.query(
          'INSERT INTO question_categories (question_id, category_id) VALUES ($1, $2)',
          [questionId, categoryId]
        );
      }
    }

    await client.query('COMMIT');
    client.release();
    res.json({ id: questionId, text, categories });
  } catch (err) {
    console.error('Error creating question:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/questions/:id', async (req, res) => {
  const { id } = req.params;
  const { text, categories } = req.body;
  try {
    const client = await pool.connect();
    await client.query('BEGIN');
    await client.query('UPDATE questions SET text = $1 WHERE id = $2', [text, id]);
    await client.query('DELETE FROM question_categories WHERE question_id = $1', [id]);

    for (const categoryName of categories) {
      const categoryResult = await client.query(
        'SELECT id FROM categories WHERE name = $1',
        [categoryName]
      );
      if (categoryResult.rows.length > 0) {
        const categoryId = categoryResult.rows[0].id;
        await client.query(
          'INSERT INTO question_categories (question_id, category_id) VALUES ($1, $2)',
          [id, categoryId]
        );
      }
    }

    await client.query('COMMIT');
    client.release();
    res.json({ id, text, categories });
  } catch (err) {
    console.error('Error updating question:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/questions/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const client = await pool.connect();
    await client.query('DELETE FROM questions WHERE id = $1', [id]);
    client.release();
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting question:', err);
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