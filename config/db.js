const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
    })
  : new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'postgres',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 5432,
    });

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  // Log but do NOT exit — pg pool handles reconnection automatically.
  // process.exit() here would crash the whole server on a transient DB hiccup.
  console.error('[DB] Unexpected error on idle client:', err.message);
});

module.exports = pool;
