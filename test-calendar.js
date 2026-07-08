require('dotenv').config();
const calendarService = require('./services/calendarService');

async function test() {
  console.log("Testing Google Calendar Sync...");
  
  const mockFollowup = {
    customer_name: "API Test User",
    reason: "Testing API Key",
    status: "Pending",
    channel: "System",
    notes: "If you see this, the API works!",
    due_date: new Date().toISOString()
  };
  
  const eventId = await calendarService.createCalendarEvent(mockFollowup);
  
  if (eventId) {
    console.log("SUCCESS! Created event with ID:", eventId);
  } else {
    console.log("FAILED to create event.");
  }
}

test();
