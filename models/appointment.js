const pool = require('../config/db');

const createAppointmentsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS appointments (
      id SERIAL PRIMARY KEY,
      boutique_id INT NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
      customer_name VARCHAR(100) NOT NULL,
      type VARCHAR(50) NOT NULL,
      date DATE NOT NULL,
      time VARCHAR(20) NOT NULL,
      notes TEXT,
      status VARCHAR(50) DEFAULT 'Scheduled',
      phone VARCHAR(20),
      assigned_to VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  const alterQuery1 = `ALTER TABLE appointments ADD COLUMN IF NOT EXISTS phone VARCHAR(20);`;
  const alterQuery2 = `ALTER TABLE appointments ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(100);`;
  
  try {
    await pool.query(query);
    await pool.query(alterQuery1);
    await pool.query(alterQuery2);
    console.log('Appointments table verified/created');
  } catch (error) {
    console.error('Error creating appointments table:', error);
  }
};

module.exports = {
  createAppointmentsTable,
};
