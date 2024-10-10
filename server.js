import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg;
const app = express();
const port = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(bodyParser.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'dist')));

console.log('DATABASE_URL:', process.env.DATABASE_URL);

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// ... rest of the server code ...

// Get questions
app.get('/api/questions', (req, res) => {
  console.log('Received request for questions');
  console.log('Sending questions:', questions);
  res.json(questions);
});

// ... rest of the server code ...

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});