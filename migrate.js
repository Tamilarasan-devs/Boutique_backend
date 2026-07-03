const pool = require('./config/db');

async function migrate() {
  try {
    await pool.query('ALTER TABLE measurement_templates ADD COLUMN customer_id INTEGER REFERENCES customers(id);');
    console.log('Added customer_id to measurement_templates');
  } catch (err) {
    console.log('Error or already exists:', err.message);
  }
  process.exit(0);
}

migrate();
