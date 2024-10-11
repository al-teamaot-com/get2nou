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
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        text TEXT NOT NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL
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
      ON CONFLICT DO NOTHING
    `);

    // Insert sample questions
    await client.query(`
      INSERT INTO questions (text) VALUES
      ('Do you enjoy outdoor activities?'),
      ('Are you a morning person?'),
      ('Do you like to travel?'),
      ('Are you interested in politics?'),
      ('Do you enjoy cooking?')
      ON CONFLICT DO NOTHING
    `);

    // Associate questions with categories
    await client.query(`
      INSERT INTO question_categories (question_id, category_id)
      VALUES
      (1, 1), (1, 3),
      (2, 1),
      (3, 2), (3, 3),
      (4, 2),
      (5, 1), (5, 3)
      ON CONFLICT DO NOTHING
    `);

    console.log('Database setup completed successfully');
    client.release();
  } catch (err) {
    console.error('Error setting up database:', err);
  } finally {
    pool.end();
  }
}

setupDatabase();