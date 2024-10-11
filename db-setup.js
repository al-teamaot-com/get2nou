import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

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
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        text TEXT NOT NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS question_categories (
        question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
        category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
        PRIMARY KEY (question_id, category_id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(255) PRIMARY KEY,
        users TEXT[] NOT NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS answers (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) REFERENCES sessions(id),
        user_id VARCHAR(255),
        question_id INTEGER REFERENCES questions(id),
        answer INTEGER,
        UNIQUE(session_id, user_id, question_id)
      )
    `);

    // Insert sample data
    await client.query(`
      INSERT INTO questions (text) VALUES
      ('Do you enjoy outdoor activities?'),
      ('Are you a morning person?'),
      ('Do you like to travel?'),
      ('Are you interested in politics?'),
      ('Do you enjoy cooking?')
      ON CONFLICT DO NOTHING
    `);

    await client.query(`
      INSERT INTO categories (name) VALUES
      ('Lifestyle'),
      ('Interests'),
      ('Hobbies')
      ON CONFLICT DO NOTHING
    `);

    // Assign categories to questions
    const questions = await client.query('SELECT id FROM questions');
    const categories = await client.query('SELECT id FROM categories');

    for (const question of questions.rows) {
      const randomCategories = categories.rows
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 3) + 1);

      for (const category of randomCategories) {
        await client.query(`
          INSERT INTO question_categories (question_id, category_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `, [question.id, category.id]);
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