const pool = require('../config/db');
const { generateDisplayId } = require('../utils/sequenceGenerator');
const { EventEmitter } = require('events');
const calendarService = require('../services/calendarService');

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
  const onFollowupDeleted = (data) => sendSSE('followup_deleted', data);

  followupEvents.on('followup_created', onFollowupCreated);
  followupEvents.on('followup_updated', onFollowupUpdated);
  followupEvents.on('followup_deleted', onFollowupDeleted);

  req.on('close', () => {
    followupEvents.off('followup_created', onFollowupCreated);
    followupEvents.off('followup_updated', onFollowupUpdated);
    followupEvents.off('followup_deleted', onFollowupDeleted);
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
  const { customer_name, customer_phone, channel, reason, due_date, status } = req.body;
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

    const display_id = await generateDisplayId(boutique_id, 'followup', 'FOL');

    const result = await pool.query(
      'INSERT INTO followups (boutique_id, customer_name, customer_phone, channel, reason, due_date, status, display_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [boutique_id, customer_name, customer_phone, channel, reason, due_date, finalStatus, display_id]
    );
    
    let newFollowup = result.rows[0];
    
    // Sync with Google Calendar
    const googleEventId = await calendarService.createCalendarEvent(newFollowup);
    if (googleEventId) {
      const updateRes = await pool.query('UPDATE followups SET google_event_id = $1 WHERE id = $2 RETURNING *', [googleEventId, newFollowup.id]);
      newFollowup = updateRes.rows[0];
    }
    
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

    let updatedFollowup = result.rows[0];
    
    // Sync update with Google Calendar
    if (updatedFollowup.google_event_id) {
      await calendarService.updateCalendarEvent(updatedFollowup.google_event_id, updatedFollowup);
    } else {
      const googleEventId = await calendarService.createCalendarEvent(updatedFollowup);
      if (googleEventId) {
        const updateRes = await pool.query('UPDATE followups SET google_event_id = $1 WHERE id = $2 RETURNING *', [googleEventId, updatedFollowup.id]);
        updatedFollowup = updateRes.rows[0];
      }
    }
    
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
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const newEntry = `[${dateStr} ${timeStr}]: ${notes.trim()}`;
      finalNotes = existingNotes ? `${existingNotes}\n${newEntry}` : newEntry;
    }

    const result = await pool.query(
      'UPDATE followups SET notes = $1, due_date = $2, status = $3 WHERE id = $4 AND boutique_id = $5 RETURNING *',
      [finalNotes, due_date, status, id, boutique_id]
    );

    let updatedFollowup = result.rows[0];
    
    // Sync update with Google Calendar
    if (updatedFollowup.google_event_id) {
      await calendarService.updateCalendarEvent(updatedFollowup.google_event_id, updatedFollowup);
    } else {
      const googleEventId = await calendarService.createCalendarEvent(updatedFollowup);
      if (googleEventId) {
        const updateRes = await pool.query('UPDATE followups SET google_event_id = $1 WHERE id = $2 RETURNING *', [googleEventId, updatedFollowup.id]);
        updatedFollowup = updateRes.rows[0];
      }
    }
    
    followupEvents.emit('followup_updated', updatedFollowup);

    res.status(200).json({
      message: 'Followup updated successfully',
      followup: updatedFollowup,
    });
  } catch (error) {
    console.error('Error updating followup:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

const deleteFollowup = async (req, res) => {
  const { id } = req.params;
  const boutique_id = req.user.boutique_id;

  try {
    const result = await pool.query(
      'DELETE FROM followups WHERE id = $1 AND boutique_id = $2 RETURNING *',
      [id, boutique_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Followup not found' });
    }

    const deletedFollowup = result.rows[0];

    // Sync deletion with Google Calendar
    if (deletedFollowup.google_event_id) {
      await calendarService.deleteCalendarEvent(deletedFollowup.google_event_id);
    }

    followupEvents.emit('followup_deleted', { id, boutique_id });

    res.status(200).json({ message: 'Followup deleted successfully' });
  } catch (error) {
    console.error('Error deleting followup:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  sseEvents,
  getFollowups,
  addFollowup,
  updateFollowupStatus,
  updateFollowup,
  deleteFollowup,
};
