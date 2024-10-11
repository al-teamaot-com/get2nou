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

// Existing API routes...

// New Category Management API routes
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

app.post('/api/categories', async (req, res) => {
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
    console.error('Error creating category:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/categories/:id', async (req, res) => {
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
    console.error('Error updating category:', err);
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
    console.error('Error deleting category:', err);
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