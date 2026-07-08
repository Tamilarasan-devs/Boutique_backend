const pool = require('../config/db');

const createAttendanceTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS attendance (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      date DATE NOT NULL DEFAULT CURRENT_DATE,
      check_in TIME,
      check_out TIME,
      status VARCHAR(20) NOT NULL DEFAULT 'Login',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(employee_id, date)
    );
  `;
  try {
    await pool.query(query);
    console.log('Attendance table verified/created');
  } catch (error) {
    console.error('Error creating attendance table:', error);
  }
};

module.exports = { createAttendanceTable };
