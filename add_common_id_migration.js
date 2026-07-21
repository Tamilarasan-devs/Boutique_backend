const pool = require('./config/db');

async function migrate() {
  const tables = ['leads', 'quotations', 'orders', 'production', 'invoices', 'trials', 'deliveries'];
  try {
    for (const table of tables) {
      await pool.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS common_id VARCHAR(50);`);
      console.log(`Added common_id to ${table}`);
    }
    console.log("Migration completed successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    pool.end();
  }
}

migrate();
