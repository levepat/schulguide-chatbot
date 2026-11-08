const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Europe/Vienna",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  weekday: "long",
});

export function viennaDate(now: Date): string {
  const parts = Object.fromEntries(formatter.formatToParts(now).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day} (${parts.weekday})`;
}
