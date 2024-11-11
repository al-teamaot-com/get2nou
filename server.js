import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Security middleware with proper CSP for React
app.use(helmet({
  contentSecurityPolicy: false // Disabled for development, configure properly for production
}));

// Configure CORS
app.use(cors());

// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));

// Database connection with connection pooling
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Middleware
app.use(express.json());
app.use(express.static(join(__dirname, 'dist')));

// API Routes
app.get('/api/questions', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM questions');
    const questions = result.rows;
    
    for (let question of questions) {
      const categoryResult = await client.query(
        `SELECT c.* FROM categories c 
         JOIN question_categories qc ON c.id = qc.category_id 
         WHERE qc.question_id = $1`,
        [question.id]
      );
      question.categories = categoryResult.rows;
    }
    
    res.json(questions);
  } catch (err) {
    console.error('Error fetching questions:', err);
    res.status(500).json({ error: 'Database error', message: err.message });
  } finally {
    client.release();
  }
});

app.post('/api/sessions', async (req, res) => {
  const { sessionId, userId } = req.body;
  if (!sessionId || !userId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const result = await client.query(
      `INSERT INTO sessions (id, users) 
       VALUES ($1, ARRAY[$2]) 
       ON CONFLICT (id) DO UPDATE 
       SET users = array_append(sessions.users, $2) 
       WHERE NOT $2 = ANY(sessions.users)
       RETURNING *`,
      [sessionId, userId]
    );
    
    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error managing session:', err);
    res.status(500).json({ error: 'Session management failed', message: err.message });
  } finally {
    client.release();
  }
});

app.post('/api/answers', async (req, res) => {
  const { sessionId, userId, questionId, answer } = req.body;
  if (!sessionId || !userId || !questionId || answer === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const result = await client.query(
      `INSERT INTO answers (session_id, user_id, question_id, answer) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (session_id, user_id, question_id) 
       DO UPDATE SET answer = $4
       RETURNING *`,
      [sessionId, userId, questionId, answer]
    );
    
    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error submitting answer:', err);
    res.status(500).json({ error: 'Answer submission failed', message: err.message });
  } finally {
    client.release();
  }
});

app.get('/api/results/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM answers WHERE session_id = $1',
      [sessionId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching results:', err);
    res.status(500).json({ error: 'Failed to fetch results', message: err.message });
  } finally {
    client.release();
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});