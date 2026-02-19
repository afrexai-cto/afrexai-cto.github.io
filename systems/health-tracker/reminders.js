#!/usr/bin/env node
// Reminder schedule: 8am, 1pm, 7pm daily
// Usage: Run via cron or openclaw cron job

const SCHEDULE = [
  { hour: 8,  label: 'morning',   msg: '🌅 Morning check-in! Log your breakfast and how you feel.' },
  { hour: 13, label: 'afternoon', msg: '☀️ Afternoon check-in! Log your lunch and any symptoms.' },
  { hour: 19, label: 'evening',   msg: '🌙 Evening check-in! Log your dinner and end-of-day notes.' },
];

function getNextReminder() {
  const now = new Date();
  const hour = now.getHours();
  const next = SCHEDULE.find(s => s.hour > hour) || SCHEDULE[0];
  return next;
}

function checkAndRemind() {
  const now = new Date();
  const hour = now.getHours();
  const match = SCHEDULE.find(s => s.hour === hour);
  if (match) {
    console.log(match.msg);
    return match;
  }
  const next = getNextReminder();
  console.log(`No reminder now. Next: ${next.label} at ${next.hour}:00`);
  return null;
}

// Export for use by openclaw cron
module.exports = { SCHEDULE, checkAndRemind, getNextReminder };

if (require.main === module) {
  checkAndRemind();
}
