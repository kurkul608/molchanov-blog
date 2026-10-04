/** `2026-10-20` (UTC). Used in Markdown front matter and `<time datetime>`. */
export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const DISPLAY_FORMAT = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

/** `Oct 20, 2026` (UTC). Used in visible UI. */
export function formatDisplayDate(date: Date): string {
  return DISPLAY_FORMAT.format(date);
}
