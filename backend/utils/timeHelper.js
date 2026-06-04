// Helper to parse time strings like "08:58 PM" or "20:58"
const parseTime = (timeStr) => {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!match) return [0, 0];
  
  let [_, hours, minutes, modifier] = match;
  hours = parseInt(hours, 10);
  minutes = parseInt(minutes, 10);

  if (modifier) {
    if (modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
    if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
  }
  return [hours, minutes];
};

// Helper function to check if an event has started (based on date and time)
exports.hasEventStarted = (eventDate, eventTime) => {
  try {
    const [hours, minutes] = parseTime(eventTime);
    
    const eventDateTime = new Date(eventDate);
    eventDateTime.setHours(hours, minutes, 0, 0);
    
    // Compare with current time
    const now = new Date();
    return now >= eventDateTime;
  } catch (error) {
    // If parsing fails, assume event hasn't started
    return false;
  }
};

// Check if event date is in the past
exports.isPastDate = (eventDate) => {
  try {
    const event = new Date(eventDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    event.setHours(0, 0, 0, 0);
    return event < today;
  } catch (error) {
    return false;
  }
};

// Check if event is expired (considering both date and time)
exports.isEventExpired = (eventDate, eventTime) => {
  try {
    const [hours, minutes] = parseTime(eventTime);
    const eventDateTime = new Date(eventDate);
    eventDateTime.setHours(hours, minutes, 0, 0);
    return new Date() >= eventDateTime;
  } catch (error) {
    return false;
  }
};
