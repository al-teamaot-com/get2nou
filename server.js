import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import winston from 'winston';

dotenv.config();

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

const app = express();
const port = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false
}));

// Configure CORS
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

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

// Test database connection
pool.on('connect', () => {
  logger.info('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  logger.error('PostgreSQL pool error:', err);
});

// Middleware
app.use(express.json());
app.use(express.static(join(__dirname, 'dist')));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

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
    
    logger.info('Successfully fetched questions');
    res.json(questions);
  } catch (err) {
    logger.error('Error fetching questions:', err);
    res.status(500).json({ error: 'Database error', message: err.message });
  } finally {
    client.release();
  }
});

app.post('/api/sessions', async (req, res) => {
  const { sessionId, userId } = req.body;
  if (!sessionId || !userId) {
    logger.warn('Missing required fields in session creation');
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
    logger.info(`Session created/updated: ${sessionId}`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Error managing session:', err);
    res.status(500).json({ error: 'Session management failed', message: err.message });
  } finally {
    client.release();
  }
});

app.post('/api/answers', async (req, res) => {
  const { sessionId, userId, questionId, answer } = req.body;
  if (!sessionId || !userId || !questionId || answer === undefined) {
    logger.warn('Missing required fields in answer submission');
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
    logger.info(`Answer submitted for session ${sessionId}`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Error submitting answer:', err);
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
    logger.info(`Results fetched for session ${sessionId}`);
    res.json(result.rows);
  } catch (err) {
    logger.error('Error fetching results:', err);
    res.status(500).json({ error: 'Failed to fetch results', message: err.message });
  } finally {
    client.release();
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});