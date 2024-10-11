import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function setupDatabase() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(255) PRIMARY KEY,
        users TEXT[] NOT NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        category VARCHAR(255)
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

    // Insert sample questions
    const questionInsertResult = await client.query(`
      INSERT INTO questions (text, category) VALUES
      ('Do you enjoy outdoor activities?', 'Lifestyle'),
      ('Are you a morning person?', 'Lifestyle'),
      ('Do you like to travel?', 'Interests'),
      ('Are you interested in politics?', 'Interests'),
      ('Do you enjoy cooking?', 'Hobbies')
      ON CONFLICT (id) DO UPDATE SET
        text = EXCLUDED.text,
        category = EXCLUDED.category
      RETURNING id
    `);

    console.log('Sample questions inserted or updated');

    await client.query('COMMIT');
    console.log('Database setup completed successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error setting up database:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

setupDatabase();