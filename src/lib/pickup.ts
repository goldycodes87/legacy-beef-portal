/**
 * Pickup window dates and times.
 *
 * `pickup_date` is a Postgres `date` ("2026-11-08") and the times are
 * `time without time zone` ("09:00:00"), both meaning ranch time in Colorado.
 * `new Date("2026-11-08")` parses as midnight UTC, which is the evening before
 * in Colorado — so the confirmation email used to name the wrong day. Every
 * date here is formatted in UTC so the calendar day never shifts.
 */

export const RANCH_TZ = 'America/Denver';

export interface PickupWindowTimes {
  pickup_date: string;
  start_time: string;
  end_time: string;
}

/** Today's date and the current time at the ranch, as "YYYY-MM-DD" and "HH:MM". */
export function ranchNow(): { date: string; time: string } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: RANCH_TZ,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date()).map((p) => [p.type, p.value])
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

/** True once a window's end time has passed at the ranch. */
export function isPickupWindowPast(w: PickupWindowTimes): boolean {
  const now = ranchNow();
  return w.pickup_date < now.date || (w.pickup_date === now.date && w.end_time.slice(0, 5) <= now.time);
}

/** "09:00:00" → "9AM", "13:30:00" → "1:30PM". */
export function formatPickupTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const hour = h % 12 || 12;
  const period = h >= 12 ? 'PM' : 'AM';
  return m === 0 ? `${hour}${period}` : `${hour}:${String(m).padStart(2, '0')}${period}`;
}

/** "9AM – 12PM" */
export function formatPickupTimeRange(w: PickupWindowTimes): string {
  return `${formatPickupTime(w.start_time)} – ${formatPickupTime(w.end_time)}`;
}

/** Formats a "YYYY-MM-DD" date without letting a time zone move it a day. */
export function formatPickupDate(date: string, options: Intl.DateTimeFormatOptions): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { ...options, timeZone: 'UTC' });
}

/** Google Calendar link for the window itself, in ranch time — not an all-day event. */
export function pickupCalendarUrl(w: PickupWindowTimes, address: string): string {
  const stamp = (time: string) => `${w.pickup_date.replace(/-/g, '')}T${time.slice(0, 5).replace(':', '')}00`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: 'Beef Pickup — Legacy Land & Cattle',
    dates: `${stamp(w.start_time)}/${stamp(w.end_time)}`,
    ctz: RANCH_TZ,
    location: address,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}
