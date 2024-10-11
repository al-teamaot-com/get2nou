import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function setupDatabase() {
  try {
    const client = await pool.connect();
    
    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(255) PRIMARY KEY,
        users TEXT[] NOT NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        text TEXT NOT NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS question_categories (
        question_id INTEGER REFERENCES questions(id),
        category_id INTEGER REFERENCES categories(id),
        PRIMARY KEY (question_id, category_id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS answers (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) REFERENCES sessions(id),
        user_id VARCHAR(255),
        question_id INTEGER REFERENCES questions(id),
        answer INTEGER
      )
    `);

    // Insert sample categories
    await client.query(`
      INSERT INTO categories (name) VALUES
      ('Lifestyle'),
      ('Interests'),
      ('Hobbies'),
      ('Work'),
      ('Family')
      ON CONFLICT (name) DO NOTHING
    `);

    // Insert sample questions with categories
    const sampleQuestions = [
      { text: 'Do you enjoy outdoor activities?', categories: ['Lifestyle', 'Hobbies'] },
      { text: 'Are you a morning person?', categories: ['Lifestyle'] },
      { text: 'Do you like to travel?', categories: ['Interests', 'Lifestyle'] },
      { text: 'Are you interested in politics?', categories: ['Interests'] },
      { text: 'Do you enjoy cooking?', categories: ['Hobbies', 'Lifestyle'] }
    ];

    for (const question of sampleQuestions) {
      const questionResult = await client.query(
        'INSERT INTO questions (text) VALUES ($1) RETURNING id',
        [question.text]
      );
      const questionId = questionResult.rows[0].id;

      for (const categoryName of question.categories) {
        const categoryResult = await client.query(
          'SELECT id FROM categories WHERE name = $1',
          [categoryName]
        );
        const categoryId = categoryResult.rows[0].id;

        await client.query(
          'INSERT INTO question_categories (question_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [questionId, categoryId]
        );
      }
    }

    console.log('Database setup completed successfully');
    client.release();
  } catch (err) {
    console.error('Error setting up database:', err);
  } finally {
    pool.end();
  }
}

setupDatabase();