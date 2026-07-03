const pool = require('../config/db');

// GET /api/attendance
// Supports ?date=YYYY-MM-DD&employee_id=&status=&page=&limit=
const getAttendance = async (req, res) => {
  const { date, employee_id, status, page, limit } = req.query;

  let conditions = [];
  const params = [];
  let idx = 1;

  if (date) {
    conditions.push(`a.date = $${idx}`);
    params.push(date);
    idx++;
  }
  if (employee_id) {
    conditions.push(`a.employee_id = $${idx}`);
    params.push(employee_id);
    idx++;
  }
  if (status) {
    conditions.push(`a.status = $${idx}`);
    params.push(status);
    idx++;
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const query = `
    SELECT
      a.*,
      e.name AS employee_name,
      e.role AS employee_role,
      e.phone AS employee_phone
    FROM attendance a
    JOIN employees e ON e.id = a.employee_id
    ${whereClause}
    ORDER BY a.date DESC, e.name ASC
  `;

  try {
    const result = await pool.query(query, params);
    const rows = result.rows;

    if (page && limit) {
      const p = parseInt(page, 10) || 1;
      const l = parseInt(limit, 10) || 10;
      const paginated = rows.slice((p - 1) * l, p * l);
      return res.status(200).json({
        attendance: paginated,
        meta: { page: p, limit: l, total: rows.length, totalPages: Math.ceil(rows.length / l) }
      });
    }

    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/attendance/by-date?date=YYYY-MM-DD
// Returns all employees with their attendance status for a given date (even unmarked ones)
const getAttendanceByDate = async (req, res) => {
  const { date } = req.query;
  const targetDate = date || new Date().toISOString().split('T')[0];

  try {
    const result = await pool.query(
      `SELECT
         e.id AS employee_id,
         e.name AS employee_name,
         e.role AS employee_role,
         e.phone AS employee_phone,
         e.status AS employee_status,
         a.id AS attendance_id,
         a.date,
         a.check_in,
         a.check_out,
         a.status,
         a.notes
       FROM employees e
       LEFT JOIN attendance a ON a.employee_id = e.id AND a.date = $1
       WHERE e.status = 'Active'
       ORDER BY e.name ASC`,
      [targetDate]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching attendance by date:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/attendance — mark/upsert single record
const markAttendance = async (req, res) => {
  const { employee_id, date, check_in, check_out, status, notes } = req.body;

  if (!employee_id) return res.status(400).json({ error: 'employee_id is required' });

  const attendanceDate = date || new Date().toISOString().split('T')[0];
  const attendanceStatus = status || 'Present';

  try {
    const result = await pool.query(
      `INSERT INTO attendance (employee_id, date, check_in, check_out, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (employee_id, date)
       DO UPDATE SET
         check_in = EXCLUDED.check_in,
         check_out = EXCLUDED.check_out,
         status = EXCLUDED.status,
         notes = EXCLUDED.notes
       RETURNING *`,
      [employee_id, attendanceDate, check_in || null, check_out || null, attendanceStatus, notes || null]
    );
    res.status(201).json({ message: 'Attendance marked successfully', attendance: result.rows[0] });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/attendance/bulk — mark all active employees for a date
const bulkMarkAttendance = async (req, res) => {
  const { date, status, records } = req.body;
  // records: optional array of { employee_id, status, check_in, check_out, notes }
  // If records provided, use those; else mark all active employees with the given status

  const attendanceDate = date || new Date().toISOString().split('T')[0];

  try {
    let toInsert = records;

    if (!toInsert || toInsert.length === 0) {
      // Fetch all active employees and mark them
      const empResult = await pool.query(`SELECT id FROM employees WHERE status = 'Active'`);
      toInsert = empResult.rows.map(e => ({
        employee_id: e.id,
        status: status || 'Present',
        check_in: null,
        check_out: null,
        notes: null
      }));
    }

    if (toInsert.length === 0) {
      return res.status(200).json({ message: 'No active employees to mark', count: 0 });
    }

    // Build bulk upsert
    const values = toInsert.map((r, i) => {
      const base = i * 6;
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`;
    });

    const flatParams = toInsert.flatMap(r => [
      r.employee_id,
      attendanceDate,
      r.check_in || null,
      r.check_out || null,
      r.status || 'Present',
      r.notes || null
    ]);

    const query = `
      INSERT INTO attendance (employee_id, date, check_in, check_out, status, notes)
      VALUES ${values.join(', ')}
      ON CONFLICT (employee_id, date)
      DO UPDATE SET
        check_in = EXCLUDED.check_in,
        check_out = EXCLUDED.check_out,
        status = EXCLUDED.status,
        notes = EXCLUDED.notes
      RETURNING *
    `;

    const result = await pool.query(query, flatParams);
    res.status(201).json({ message: 'Bulk attendance marked', count: result.rowCount, attendance: result.rows });
  } catch (error) {
    console.error('Error bulk marking attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/attendance/:id
const updateAttendance = async (req, res) => {
  const { id } = req.params;
  const { check_in, check_out, status, notes } = req.body;

  try {
    const result = await pool.query(
      `UPDATE attendance SET check_in=$1, check_out=$2, status=$3, notes=$4 WHERE id=$5 RETURNING *`,
      [check_in || null, check_out || null, status || 'Present', notes || null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Attendance record not found' });
    res.status(200).json({ message: 'Attendance updated successfully', attendance: result.rows[0] });
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/attendance/:id
const deleteAttendance = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM attendance WHERE id=$1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Attendance record not found' });
    res.status(200).json({ message: 'Attendance deleted successfully' });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/attendance/summary?month=YYYY-MM&employee_id=
const getAttendanceSummary = async (req, res) => {
  const { month, employee_id } = req.query;
  const targetMonth = month || new Date().toISOString().slice(0, 7); // YYYY-MM

  let conditions = [`TO_CHAR(a.date, 'YYYY-MM') = $1`];
  const params = [targetMonth];
  let idx = 2;

  if (employee_id) {
    conditions.push(`a.employee_id = $${idx}`);
    params.push(employee_id);
    idx++;
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  try {
    const result = await pool.query(
      `SELECT
         e.id AS employee_id,
         e.name AS employee_name,
         e.role AS employee_role,
         COUNT(*) FILTER (WHERE a.status = 'Present') AS present_days,
         COUNT(*) FILTER (WHERE a.status = 'Absent') AS absent_days,
         COUNT(*) FILTER (WHERE a.status = 'Half-Day') AS half_days,
         COUNT(*) FILTER (WHERE a.status = 'Late') AS late_days,
         COUNT(*) AS total_marked
       FROM attendance a
       JOIN employees e ON e.id = a.employee_id
       ${whereClause}
       GROUP BY e.id, e.name, e.role
       ORDER BY e.name ASC`,
      params
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching attendance summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAttendance,
  getAttendanceByDate,
  markAttendance,
  bulkMarkAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceSummary
};
