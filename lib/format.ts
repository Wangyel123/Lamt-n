// Small display helpers.

const timeFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/** "9 Nov, 11:20". Only call in the browser (times are the counsellor's local time). */
export function formatTime(iso: string): string {
  return timeFormat.format(new Date(iso));
}
