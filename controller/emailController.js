const pool = require('../config/db');

// POST /api/email/log — save a sent email record
const logEmail = async (req, res) => {
  const { to_email, to_name, subject, message, template_name, status, error_message } = req.body;
  const boutique_id = req.user.boutique_id;

  if (!to_email || !subject || !message) {
    return res.status(400).json({ error: 'to_email, subject, and message are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO email_logs (boutique_id, to_email, to_name, subject, message, template_name, status, error_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        boutique_id,
        to_email,
        to_name || null,
        subject,
        message,
        template_name || null,
        status || 'sent',
        error_message || null,
      ]
    );
    res.status(201).json({ message: 'Email logged successfully', log: result.rows[0] });
  } catch (error) {
    console.error('Error logging email:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/email/logs — get all email logs with pagination + search
const getEmailLogs = async (req, res) => {
  const { search, status, page, limit } = req.query;
  const boutique_id = req.user.boutique_id;

  let conditions = [`boutique_id = $1`];
  const params = [boutique_id];
  let idx = 2;

  if (search) {
    conditions.push(`(to_email ILIKE $${idx} OR to_name ILIKE $${idx} OR subject ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }
  if (status) {
    conditions.push(`status = $${idx}`);
    params.push(status);
    idx++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await pool.query(
      `SELECT * FROM email_logs ${where} ORDER BY sent_at DESC`,
      params
    );

    const rows = result.rows;

    if (page && limit) {
      const p = parseInt(page, 10) || 1;
      const l = parseInt(limit, 10) || 10;
      const paginated = rows.slice((p - 1) * l, p * l);
      return res.status(200).json({
        logs: paginated,
        meta: { page: p, limit: l, total: rows.length, totalPages: Math.ceil(rows.length / l) }
      });
    }

    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching email logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/email/stats — summary stats for the dashboard strip
const getEmailStats = async (req, res) => {
  const boutique_id = req.user.boutique_id;
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) AS total_sent,
        COUNT(*) FILTER (WHERE status = 'sent') AS successful,
        COUNT(*) FILTER (WHERE status = 'failed') AS failed,
        COUNT(*) FILTER (WHERE sent_at >= CURRENT_DATE) AS sent_today
      FROM email_logs
      WHERE boutique_id = $1
    `, [boutique_id]);
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching email stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/email/logs/:id — delete a log record
const deleteEmailLog = async (req, res) => {
  const { id } = req.params;
  const boutique_id = req.user.boutique_id;
  try {
    const result = await pool.query('DELETE FROM email_logs WHERE id=$1 AND boutique_id=$2 RETURNING *', [id, boutique_id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Log not found' });
    res.status(200).json({ message: 'Log deleted' });
  } catch (error) {
    console.error('Error deleting email log:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { logEmail, getEmailLogs, getEmailStats, deleteEmailLog };
