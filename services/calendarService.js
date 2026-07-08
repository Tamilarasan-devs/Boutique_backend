const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

// Path to the service account key file
const KEYFILEPATH = path.join(__dirname, '../google-credentials.json');

// Check if credentials exist
let calendar = null;

if (fs.existsSync(KEYFILEPATH)) {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
  
  calendar = google.calendar({ version: 'v3', auth });
} else {
  console.warn('Google Calendar credentials not found. Calendar sync is disabled.');
}

// Get the Calendar ID from env, or default to primary (service account's own calendar)
const getCalendarId = () => {
  return process.env.GOOGLE_CALENDAR_ID || 'primary';
};

const formatEvent = (followup) => {
  const date = followup.due_date ? new Date(followup.due_date) : new Date();
  const dateString = date.toISOString().split('T')[0];
  
  const event = {
    summary: `Follow-up: ${followup.customer_name}`,
    description: `Reason: ${followup.reason}\n\nStatus: ${followup.status || 'Pending'}\nChannel: ${followup.channel}\n\nNotes: ${followup.notes || ''}`,
    start: {
      date: dateString,
      timeZone: 'Asia/Kolkata', // Adjust as needed
    },
    end: {
      date: dateString,
      timeZone: 'Asia/Kolkata',
    },
    // Optional: Add color coding based on status
    colorId: followup.status === 'Completed' ? '8' : (followup.status === 'Overdue' ? '11' : '9'),
  };

  if (followup.customer_email) {
    event.attendees = [{ email: followup.customer_email }];
  }

  return event;
};

const createCalendarEvent = async (followup) => {
  if (!calendar) return null;
  
  try {
    const event = formatEvent(followup);
    const response = await calendar.events.insert({
      calendarId: getCalendarId(),
      resource: event,
    });
    
    return response.data.id;
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    return null;
  }
};

const updateCalendarEvent = async (eventId, followup) => {
  if (!calendar || !eventId) return null;
  
  try {
    const event = formatEvent(followup);
    const response = await calendar.events.update({
      calendarId: getCalendarId(),
      eventId: eventId,
      resource: event,
    });
    
    return response.data.id;
  } catch (error) {
    console.error('Error updating Google Calendar event:', error);
    return null;
  }
};

const deleteCalendarEvent = async (eventId) => {
  if (!calendar || !eventId) return false;
  
  try {
    await calendar.events.delete({
      calendarId: getCalendarId(),
      eventId: eventId,
    });
    return true;
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error);
    return false;
  }
};

module.exports = {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent
};
