import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import winston from 'winston';

dotenv.config();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

const app = express();
const port = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Security middleware
app.use(helmet());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));

app.use(express.json());
app.use(express.static(join(__dirname, 'dist')));

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
};

// Validation middleware
const validateCategory = [
  body('name').trim().isLength({ min: 1 }).escape(),
];

// Categories API with validation and error handling
app.get('/api/categories', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM categories');
    client.release();
    res.json(result.rows);
  } catch (err) {
    logger.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/categories', validateCategory, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

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
    logger.error('Error creating category:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/categories/:id', validateCategory, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

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
    logger.error('Error updating category:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const client = await pool.connect();
    await client.query('DELETE FROM categories WHERE id = $1', [id]);
    client.release();
    res.status(204).send();
  } catch (err) {
    logger.error('Error deleting category:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  pool.end(() => {
    logger.info('Database pool has ended');
    process.exit(0);
  });
});

app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});