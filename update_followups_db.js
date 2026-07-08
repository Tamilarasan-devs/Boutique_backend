const pool = require('./config/db');

async function updateDb() {
  try {
    await pool.query('ALTER TABLE followups ADD COLUMN google_event_id VARCHAR(255);');
    console.log('Added google_event_id to followups table.');
  } catch (err) {
    if (err.code === '42701') {
      console.log('Column google_event_id already exists.');
    } else {
      console.error('Error:', err);
    }
  } finally {
    process.exit(0);
  }
}
updateDb();
