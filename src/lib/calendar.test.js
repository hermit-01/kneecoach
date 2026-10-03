import { describe, it, expect } from 'vitest';
import { dailyReminderUrl } from './calendar.js';

describe('dailyReminderUrl', () => {
  it('builds a daily repeating Google Calendar event', () => {
    const url = new URL(dailyReminderUrl({ time: '08:00', startDate: '2026-10-05', timeZone: 'Asia/Kolkata' }));
    expect(url.hostname).toBe('calendar.google.com');
    expect(url.searchParams.get('action')).toBe('TEMPLATE');
    expect(url.searchParams.get('dates')).toBe('20261005T080000/20261005T081500');
    expect(url.searchParams.get('recur')).toBe('RRULE:FREQ=DAILY');
    expect(url.searchParams.get('ctz')).toBe('Asia/Kolkata');
  });
  it('never ends a reminder after midnight', () => {
    const url = new URL(dailyReminderUrl({ time: '23:55', startDate: '2026-10-05', timeZone: 'Asia/Kolkata' }));
    expect(url.searchParams.get('dates')).toBe('20261005T235500/20261005T235900');
  });
});
