// A Google Calendar "new event" link that repeats daily (spec §4, screen 0).
export function dailyReminderUrl({
  time,
  startDate,
  title = 'Knee exercises (KneeCoach)',
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
}) {
  const [hh, mm] = time.split(':').map(Number);
  const pad = (n) => String(n).padStart(2, '0');
  const day = startDate.replaceAll('-', '');
  const endMinutes = Math.min(hh * 60 + mm + 15, 23 * 60 + 59);
  const start = `${day}T${pad(hh)}${pad(mm)}00`;
  const end = `${day}T${pad(Math.floor(endMinutes / 60))}${pad(endMinutes % 60)}00`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${start}/${end}`,
    ctz: timeZone,
    recur: 'RRULE:FREQ=DAILY',
    details: "Open KneeCoach and do today's round.",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
