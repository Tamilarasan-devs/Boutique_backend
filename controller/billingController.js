const pool = require('../config/db');
const { EventEmitter } = require('events');

// Global event emitter for streaming updates in real time
const billingEvents = new EventEmitter();

// SSE Endpoint logic to stream updates
const sseEvents = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const boutique_id = req.user.boutique_id;

  const sendSSE = (event, data) => {
    // Only send events related to this boutique
    if (data && data.boutique_id === boutique_id) {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    }
  };

  const onInvoiceCreated = (invoice) => sendSSE('invoice_created', invoice);
  const onInvoiceUpdated = (invoice) => sendSSE('invoice_updated', invoice);
  const onPaymentRecorded = (payment) => sendSSE('payment_recorded', payment);

  billingEvents.on('invoice_created', onInvoiceCreated);
  billingEvents.on('invoice_updated', onInvoiceUpdated);
  billingEvents.on('payment_recorded', onPaymentRecorded);

  req.on('close', () => {
    billingEvents.off('invoice_created', onInvoiceCreated);
    billingEvents.off('invoice_updated', onInvoiceUpdated);
    billingEvents.off('payment_recorded', onPaymentRecorded);
    res.end();
  });
};

// Invoices logic
const getInvoices = async (req, res) => {
  const boutique_id = req.user.boutique_id;
  try {
    // Dynamically update Overdue status if due date has passed and status is Pending
    await pool.query(
      `UPDATE invoices 
       SET status = 'Overdue' 
       WHERE status = 'Pending' AND due_date < CURRENT_DATE AND boutique_id = $1`,
      [boutique_id]
    );

    const result = await pool.query('SELECT * FROM invoices WHERE boutique_id = $1 ORDER BY invoice_date DESC, id DESC', [boutique_id]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getInvoiceById = async (req, res) => {
  const { id } = req.params;
  const boutique_id = req.user.boutique_id;
  try {
    const result = await pool.query('SELECT * FROM invoices WHERE id = $1 AND boutique_id = $2', [id, boutique_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createInvoice = async (req, res) => {
  const { order_id, quotation_id, customer_name, invoice_date, due_date, total_amount, items } = req.body;
  const boutique_id = req.user.boutique_id;

  if (!customer_name || !due_date || !total_amount || !items) {
    return res.status(400).json({ error: 'Missing required invoice fields' });
  }

  try {
    // Generate invoice number e.g. INV-2026-001
    const year = new Date(invoice_date || new Date()).getFullYear();
    const countRes = await pool.query('SELECT COUNT(*) FROM invoices WHERE invoice_number LIKE $1 AND boutique_id = $2', [`INV-${year}-%`, boutique_id]);
    const nextNum = parseInt(countRes.rows[0].count, 10) + 1;
    const invoice_number = `INV-${year}-${String(nextNum).padStart(3, '0')}`;

    const itemsStr = typeof items === 'string' ? items : JSON.stringify(items);

    const result = await pool.query(
      `INSERT INTO invoices (
        boutique_id, invoice_number, order_id, quotation_id, customer_name, invoice_date, due_date, total_amount, status, items
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        boutique_id,
        invoice_number,
        order_id || null,
        quotation_id || null,
        customer_name,
        invoice_date || new Date(),
        due_date,
        total_amount,
        'Pending',
        itemsStr
      ]
    );

    const newInvoice = result.rows[0];

    // If invoice is created from a quotation, mark quotation as Invoiced
    if (quotation_id) {
      await pool.query(
        'UPDATE quotations SET status = $1 WHERE id = $2 AND boutique_id = $3',
        ['Invoiced', quotation_id, boutique_id]
      );
    }

    // Emit event
    billingEvents.emit('invoice_created', newInvoice);

    res.status(201).json({
      message: 'Invoice created successfully',
      invoice: newInvoice
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateInvoiceStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const boutique_id = req.user.boutique_id;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  try {
    const result = await pool.query(
      'UPDATE invoices SET status = $1 WHERE id = $2 AND boutique_id = $3 RETURNING *',
      [status, id, boutique_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const updatedInvoice = result.rows[0];

    // Emit event
    billingEvents.emit('invoice_updated', updatedInvoice);

    res.status(200).json({
      message: 'Invoice status updated successfully',
      invoice: updatedInvoice
    });
  } catch (error) {
    console.error('Error updating invoice status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteInvoice = async (req, res) => {
  const { id } = req.params;
  const boutique_id = req.user.boutique_id;
  try {
    const result = await pool.query('DELETE FROM invoices WHERE id = $1 AND boutique_id = $2 RETURNING *', [id, boutique_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Emit event with deleted flag
    billingEvents.emit('invoice_updated', { id: parseInt(id, 10), deleted: true, boutique_id });

    res.status(200).json({
      message: 'Invoice deleted successfully',
      invoice: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Payments logic
const getPayments = async (req, res) => {
  const boutique_id = req.user.boutique_id;
  try {
    const result = await pool.query('SELECT * FROM payments WHERE boutique_id = $1 ORDER BY payment_date DESC, id DESC', [boutique_id]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const recordPayment = async (req, res) => {
  const { invoice_id, customer_name, amount, method, payment_date, note } = req.body;
  const boutique_id = req.user.boutique_id;

  if (!invoice_id || !customer_name || !amount || !method) {
    return res.status(400).json({ error: 'Missing required payment fields' });
  }

  try {
    // Check if invoice exists and belongs to this boutique
    const invoiceRes = await pool.query('SELECT * FROM invoices WHERE id = $1 AND boutique_id = $2', [invoice_id, boutique_id]);
    if (invoiceRes.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    const invoice = invoiceRes.rows[0];

    // Generate receipt number e.g. PAY-001
    const countRes = await pool.query('SELECT COUNT(*) FROM payments WHERE boutique_id = $1', [boutique_id]);
    const nextNum = parseInt(countRes.rows[0].count, 10) + 1;
    const receipt_number = `PAY-${String(nextNum).padStart(3, '0')}`;

    // Insert payment record
    const payResult = await pool.query(
      `INSERT INTO payments (
        boutique_id, receipt_number, invoice_id, customer_name, amount, method, payment_date, note
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        boutique_id,
        receipt_number,
        invoice_id,
        customer_name,
        amount,
        method,
        payment_date || new Date(),
        note || ''
      ]
    );
    const newPayment = payResult.rows[0];

    // Sum all payments for this invoice
    const sumRes = await pool.query('SELECT SUM(amount) FROM payments WHERE invoice_id = $1 AND boutique_id = $2', [invoice_id, boutique_id]);
    const totalPaid = parseFloat(sumRes.rows[0].sum || 0);

    // Calculate new status
    let newStatus = 'Pending';
    if (totalPaid >= parseFloat(invoice.total_amount)) {
      newStatus = 'Paid';
    }

    // Update invoice status
    const invUpdateRes = await pool.query(
      'UPDATE invoices SET status = $1 WHERE id = $2 AND boutique_id = $3 RETURNING *',
      [newStatus, invoice_id, boutique_id]
    );
    const updatedInvoice = invUpdateRes.rows[0];

    // If invoice is linked to an order, let's also update the order's advance_paid
    if (invoice.order_id) {
      await pool.query(
        'UPDATE orders SET advance_paid = advance_paid + $1 WHERE id = $2 AND boutique_id = $3',
        [amount, invoice.order_id, boutique_id]
      );
    }

    // Emit real-time updates
    billingEvents.emit('payment_recorded', newPayment);
    billingEvents.emit('invoice_updated', updatedInvoice);

    res.status(201).json({
      message: 'Payment recorded successfully',
      payment: newPayment,
      invoice: updatedInvoice
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  sseEvents,
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoiceStatus,
  deleteInvoice,
  getPayments,
  recordPayment
};
