// ... existing imports ...

import { promisify } from 'util';

// ... existing code ...

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

// ... rest of the file remains the same ...

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