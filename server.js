// Add question management endpoints to server.js
app.post('/api/questions', async (req, res) => {
  const { text, categories } = req.body;
  if (!text || !categories) {
    logger.warn('Missing required fields in question creation');
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
    logger.info(`Question created with ID: ${questionId}`);
    
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
    res.status(500).json({ error: 'Question creation failed', message: err.message });
  } finally {
    client.release();
  }
});

app.put('/api/questions/:id', async (req, res) => {
  const { id } = req.params;
  const { text, categories } = req.body;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query(
      'UPDATE questions SET text = $1 WHERE id = $2',
      [text, id]
    );
    
    await client.query(
      'DELETE FROM question_categories WHERE question_id = $1',
      [id]
    );
    
    for (const categoryId of categories) {
      await client.query(
        'INSERT INTO question_categories (question_id, category_id) VALUES ($1, $2)',
        [id, categoryId]
      );
    }
    
    await client.query('COMMIT');
    logger.info(`Question updated: ${id}`);
    
    const updatedQuestion = {
      id,
      text,
      categories: await client.query(
        `SELECT c.* FROM categories c 
         JOIN question_categories qc ON c.id = qc.category_id 
         WHERE qc.question_id = $1`,
        [id]
      ).then(result => result.rows)
    };
    
    res.json(updatedQuestion);
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Error updating question:', err);
    res.status(500).json({ error: 'Question update failed', message: err.message });
  } finally {
    client.release();
  }
});

app.delete('/api/questions/:id', async (req, res) => {
  const { id } = req.params;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query(
      'DELETE FROM question_categories WHERE question_id = $1',
      [id]
    );
    
    await client.query(
      'DELETE FROM questions WHERE id = $1',
      [id]
    );
    
    await client.query('COMMIT');
    logger.info(`Question deleted: ${id}`);
    res.status(204).send();
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Error deleting question:', err);
    res.status(500).json({ error: 'Question deletion failed', message: err.message });
  } finally {
    client.release();
  }
});