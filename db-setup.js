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
    await client.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        category TEXT
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        users TEXT[] NOT NULL
      );

      CREATE TABLE IF NOT EXISTS answers (
        id SERIAL PRIMARY KEY,
        session_id TEXT REFERENCES sessions(id),
        user_id TEXT NOT NULL,
        question_id INTEGER REFERENCES questions(id),
        answer INTEGER NOT NULL
      );

      -- Insert some sample questions
      INSERT INTO questions (text, category) VALUES
      ('Do you enjoy outdoor activities?', 'Lifestyle'),
      ('Are you a morning person?', 'Lifestyle'),
      ('Do you like to travel?', 'Interests'),
      ('Are you interested in politics?', 'Interests'),
      ('Do you enjoy cooking?', 'Hobbies')
      ON CONFLICT DO NOTHING;
    `);
    console.log('Database setup completed successfully');
  } catch (err) {
    console.error('Error setting up database:', err);
  } finally {
    client.release();
  }
}

setupDatabase().then(() => process.exit());