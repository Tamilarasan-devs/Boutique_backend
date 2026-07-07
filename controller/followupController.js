const pool = require('../config/db');
const { EventEmitter } = require('events');

const followupEvents = new EventEmitter();

const sseEvents = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const boutique_id = req.user.boutique_id;

  const sendSSE = (event, data) => {
    if (data && String(data.boutique_id) === String(boutique_id)) {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    }
  };

  const onFollowupCreated = (f) => sendSSE('followup_created', f);
  const onFollowupUpdated = (f) => sendSSE('followup_updated', f);

  followupEvents.on('followup_created', onFollowupCreated);
  followupEvents.on('followup_updated', onFollowupUpdated);

  req.on('close', () => {
    followupEvents.off('followup_created', onFollowupCreated);
    followupEvents.off('followup_updated', onFollowupUpdated);
    res.end();
  });
};

const getFollowups = async (req, res) => {
  const boutique_id = req.user.boutique_id;
  try {
    const result = await pool.query('SELECT * FROM followups WHERE boutique_id = $1 ORDER BY due_date ASC', [boutique_id]);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const updatedRows = result.rows.map(row => {
      const dueDate = new Date(row.due_date);
      if (row.status === 'Pending' && dueDate < today) {
        row.status = 'Overdue';
        // Lazy update to database
        pool.query('UPDATE followups SET status = $1 WHERE id = $2', ['Overdue', row.id]).catch(err => console.error('Failed to auto-update overdue status', err));
      }
      return row;
    });

    res.status(200).json(updatedRows);
  } catch (error) {
    console.error('Error fetching followups:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const addFollowup = async (req, res) => {
  const { customer_name, channel, reason, due_date, status } = req.body;
  const boutique_id = req.user.boutique_id;

  if (!customer_name || !channel || !reason || !due_date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const dueDateObj = new Date(due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let finalStatus = status || 'Pending';
    if (finalStatus === 'Pending' && dueDateObj < today) {
      finalStatus = 'Overdue';
    }

    const result = await pool.query(
      'INSERT INTO followups (boutique_id, customer_name, channel, reason, due_date, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [boutique_id, customer_name, channel, reason, due_date, finalStatus]
    );
    
    const newFollowup = result.rows[0];
    followupEvents.emit('followup_created', newFollowup);
    
    res.status(201).json({
      message: 'Followup added successfully',
      followup: newFollowup,
    });
  } catch (error) {
    console.error('Error adding followup:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateFollowupStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const boutique_id = req.user.boutique_id;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  try {
    const result = await pool.query(
      'UPDATE followups SET status = $1 WHERE id = $2 AND boutique_id = $3 RETURNING *',
      [status, id, boutique_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Followup not found' });
    }

    const updatedFollowup = result.rows[0];
    followupEvents.emit('followup_updated', updatedFollowup);

    res.status(200).json({
      message: 'Followup status updated successfully',
      followup: updatedFollowup,
    });
  } catch (error) {
    console.error('Error updating followup status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateFollowup = async (req, res) => {
  const { id } = req.params;
  const { notes, due_date, status } = req.body;
  const boutique_id = req.user.boutique_id;

  try {
    const getRes = await pool.query('SELECT notes FROM followups WHERE id = $1 AND boutique_id = $2', [id, boutique_id]);
    if (getRes.rows.length === 0) {
      return res.status(404).json({ error: 'Followup not found' });
    }

    const existingNotes = getRes.rows[0].notes || '';
    let finalNotes = existingNotes;
    if (notes && notes.trim().length > 0) {
      const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const newEntry = `[${dateStr}]: ${notes.trim()}`;
      finalNotes = existingNotes ? `${existingNotes}\n${newEntry}` : newEntry;
    }

    const result = await pool.query(
      'UPDATE followups SET notes = $1, due_date = $2, status = $3 WHERE id = $4 AND boutique_id = $5 RETURNING *',
      [finalNotes, due_date, status, id, boutique_id]
    );

    const updatedFollowup = result.rows[0];
    followupEvents.emit('followup_updated', updatedFollowup);

    res.status(200).json({
      message: 'Followup updated successfully',
      followup: updatedFollowup,
    });
  } catch (error) {
    console.error('Error updating followup:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  sseEvents,
  getFollowups,
  addFollowup,
  updateFollowupStatus,
  updateFollowup,
};
