const express = require('express');
const cors = require('cors');
const { json } = require('body-parser');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(json());

console.log('Initializing database connection...');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

console.log('Database connection initialized');

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'dist')));

// The rest of your server code remains the same...

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});