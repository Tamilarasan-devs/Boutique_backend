const pool = require('../config/db');

// GET /api/employees
const getEmployees = async (req, res) => {
  const { search, role, status, page, limit } = req.query;
  const boutique_id = req.user.boutique_id;

  const conditions = [`e.boutique_id = $1`];
  const params = [boutique_id];
  let idx = 2;

  if (search) {
    conditions.push(`(e.name ILIKE $${idx} OR e.email ILIKE $${idx} OR e.phone ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }
  if (role) {
    conditions.push(`e.role = $${idx}`);
    params.push(role);
    idx++;
  }
  if (status) {
    conditions.push(`e.status = $${idx}`);
    params.push(status);
    idx++;
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const baseQuery = `
    SELECT
      e.*,
      COALESCE(
        (SELECT COUNT(*) FROM orders o WHERE o.tailor ILIKE e.name AND o.boutique_id = e.boutique_id AND o.status NOT IN ('Delivered','Cancelled')),
        0
      )::integer AS active_orders_count,
      COALESCE(
        (SELECT COUNT(*) FROM attendance a WHERE a.employee_id = e.id AND a.date >= date_trunc('month', CURRENT_DATE) AND a.status = 'Present'),
        0
      )::integer AS present_this_month
    FROM employees e
    ${whereClause}
    ORDER BY e.created_at DESC
  `;

  try {
    const result = await pool.query(baseQuery, params);
    const rows = result.rows;

    if (page && limit) {
      const p = parseInt(page, 10) || 1;
      const l = parseInt(limit, 10) || 10;
      const paginated = rows.slice((p - 1) * l, p * l);
      return res.status(200).json({
        employees: paginated,
        meta: { page: p, limit: l, total: rows.length, totalPages: Math.ceil(rows.length / l) }
      });
    }

    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/employees/:id
const getEmployeeById = async (req, res) => {
  const { id } = req.params;
  const boutique_id = req.user.boutique_id;
  try {
    const result = await pool.query('SELECT * FROM employees WHERE id = $1 AND boutique_id = $2', [id, boutique_id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Employee not found' });
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching employee by id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/employees
const addEmployee = async (req, res) => {
  const { name, email, phone, role, salary, join_date, status, address, notes } = req.body;
  const boutique_id = req.user.boutique_id;

  if (!name) return res.status(400).json({ error: 'Name is required' });
  if (!role) return res.status(400).json({ error: 'Role is required' });

  const validRoles = ['Tailor', 'Receptionist', 'Manager', 'Other'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: `Role must be one of: ${validRoles.join(', ')}` });
  }

  try {
    const result = await pool.query(
      `INSERT INTO employees (boutique_id, name, email, phone, role, salary, join_date, status, address, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [boutique_id, name, email || null, phone || null, role, salary || 0, join_date || new Date(), status || 'Active', address || null, notes || null]
    );
    res.status(201).json({ message: 'Employee added successfully', employee: result.rows[0] });
  } catch (error) {
    console.error('Error adding employee:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/employees/:id
const updateEmployee = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, role, salary, join_date, status, address, notes } = req.body;
  const boutique_id = req.user.boutique_id;

  if (!name) return res.status(400).json({ error: 'Name is required' });
  if (!role) return res.status(400).json({ error: 'Role is required' });

  try {
    const result = await pool.query(
      `UPDATE employees
       SET name=$1, email=$2, phone=$3, role=$4, salary=$5, join_date=$6, status=$7, address=$8, notes=$9
       WHERE id=$10 AND boutique_id=$11 RETURNING *`,
      [name, email || null, phone || null, role, salary || 0, join_date, status || 'Active', address || null, notes || null, id, boutique_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Employee not found' });
    res.status(200).json({ message: 'Employee updated successfully', employee: result.rows[0] });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/employees/:id
const deleteEmployee = async (req, res) => {
  const { id } = req.params;
  const boutique_id = req.user.boutique_id;
  try {
    const result = await pool.query('DELETE FROM employees WHERE id=$1 AND boutique_id=$2 RETURNING *', [id, boutique_id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Employee not found' });
    res.status(200).json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getEmployees,
  getEmployeeById,
  addEmployee,
  updateEmployee,
  deleteEmployee
};
