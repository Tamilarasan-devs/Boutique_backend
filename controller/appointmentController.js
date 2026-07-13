const pool = require('../config/db');
const { generateDisplayId } = require('../utils/sequenceGenerator');

const getAppointments = async (req, res) => {
  const boutique_id = req.user.boutique_id;
  try {
    const result = await pool.query('SELECT * FROM appointments WHERE boutique_id = $1 ORDER BY date ASC, time ASC', [boutique_id]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const addAppointment = async (req, res) => {
  const { customer_name, type, date, time, notes, status, phone, assigned_to } = req.body;
  const boutique_id = req.user.boutique_id;

  if (!customer_name || !type || !date || !time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const display_id = await generateDisplayId(boutique_id, 'appointment', 'APT');

    const result = await pool.query(
      'INSERT INTO appointments (boutique_id, customer_name, type, date, time, notes, status, phone, assigned_to, display_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [boutique_id, customer_name, type, date, time, notes, status || 'Scheduled', phone, assigned_to, display_id]
    );
    
    res.status(201).json({
      message: 'Appointment added successfully',
      appointment: result.rows[0],
    });
  } catch (error) {
    console.error('Error adding appointment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateAppointmentStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const boutique_id = req.user.boutique_id;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  try {
    const result = await pool.query(
      'UPDATE appointments SET status = $1 WHERE id = $2 AND boutique_id = $3 RETURNING *',
      [status, id, boutique_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.status(200).json({
      message: 'Appointment status updated successfully',
      appointment: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteAppointment = async (req, res) => {
  const { id } = req.params;
  const boutique_id = req.user.boutique_id;

  try {
    const result = await pool.query('DELETE FROM appointments WHERE id = $1 AND boutique_id = $2 RETURNING *', [id, boutique_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.status(200).json({
      message: 'Appointment deleted successfully',
      appointment: result.rows[0],
    });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAppointments,
  addAppointment,
  updateAppointmentStatus,
  deleteAppointment,
};
