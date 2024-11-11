import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import winston from 'winston';

// Configure environment variables
dotenv.config();

// Set up Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

const app = express();
const port = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database configuration
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test database connection
pool.connect()
  .then(() => logger.info('Database connected successfully'))
  .catch(err => logger.error('Database connection error:', err));

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Middleware
app.use(express.json());
app.use(express.static(join(__dirname, 'dist')));

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// API Routes
app.get('/api/questions', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT q.id, q.text, 
        json_agg(json_build_object('id', c.id, 'name', c.name)) as categories
      FROM questions q
      LEFT JOIN question_categories qc ON q.id = qc.question_id
      LEFT JOIN categories c ON qc.category_id = c.id
      GROUP BY q.id, q.text
    `);
    client.release();
    res.json(result.rows);
  } catch (err) {
    logger.error('Error fetching questions:', err);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

app.post('/api/sessions', async (req, res) => {
  const { sessionId, userId } = req.body;
  try {
    const client = await pool.connect();
    await client.query(
      'INSERT INTO sessions (id, users) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET users = array_append(sessions.users, $3)',
      [sessionId, [userId], userId]
    );
    client.release();
    res.status(201).json({ sessionId, userId });
  } catch (err) {
    logger.error('Error creating/joining session:', err);
    res.status(500).json({ error: 'Failed to create/join session' });
  }
});

app.post('/api/questions', async (req, res) => {
  const { text, categories } = req.body;
  if (!text || !categories) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const questionResult = await client.query(
      'INSERT INTO questions (text) VALUES ($1) RETURNING id, text',
      [text]
    );
    
    const questionId = questionResult.rows[0].id;
    
    for (const categoryId of categories) {
      await client.query(
        'INSERT INTO question_categories (question_id, category_id) VALUES ($1, $2)',
        [questionId, categoryId]
      );
    }
    
    await client.query('COMMIT');
    
    const newQuestion = {
      ...questionResult.rows[0],
      categories: await client.query(
        `SELECT c.* FROM categories c 
         JOIN question_categories qc ON c.id = qc.category_id 
         WHERE qc.question_id = $1`,
        [questionId]
      ).then(result => result.rows)
    };
    
    res.status(201).json(newQuestion);
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Error creating question:', err);
    res.status(500).json({ error: 'Question creation failed' });
  } finally {
    client.release();
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

// Start server
app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});