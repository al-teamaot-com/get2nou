const express = require('express');
const pg = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const { promisify } = require('util');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

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

app.put('/api/questions/:id', async (req, res) => {
  const { id } = req.params;
  const { text, category } = req.body;
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    console.log('Updating question:', id, text, category);

    const updateResult = await client.query(
      'UPDATE questions SET text = $1, category = $2 WHERE id = $3 RETURNING *',
      [text, category, id]
    );

    console.log('Update result:', updateResult.rows);

    if (updateResult.rowCount === 0) {
      throw new Error('Question not found');
    }

    await client.query('COMMIT');
    res.json(updateResult.rows[0]);
  } catch (err) {
    console.error('Error updating question:', err);
    if (client) {
      await client.query('ROLLBACK');
    }
    res.status(500).json({ error: 'Internal server error', details: err.message });
  } finally {
    if (client) {
      client.release();
    }
  }
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const startServer = async () => {
  try {
    await promisify(app.listen.bind(app))(port);
    console.log(`Server running on port ${port}`);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();