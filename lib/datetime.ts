export const INDIAN_TIMEZONE = "Asia/Kolkata";

/** Current date & time in IST, formatted for `<input type="datetime-local" />`. */
export function getCurrentIndianDateTime(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: INDIAN_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/** Interpret a datetime-local value as IST and convert to UTC ISO for the API. */
export function indianDateTimeToUtcIso(datetimeLocal: string): string {
  return new Date(`${datetimeLocal}:00+05:30`).toISOString();
}

/** Parse API datetimes (stored as UTC, often returned without a timezone suffix). */
export function parseStoredUtcDate(dateStr: string): Date {
  const trimmed = dateStr.trim();
  if (trimmed.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(trimmed)) {
    return new Date(trimmed);
  }
  return new Date(`${trimmed}Z`);
}

export function formatIndianDate(dateStr: string): string {
  return parseStoredUtcDate(dateStr).toLocaleDateString("en-IN", {
    timeZone: INDIAN_TIMEZONE,
    month: "short",
    day: "numeric",
  });
}

export function formatIndianTime(dateStr: string): string {
  return parseStoredUtcDate(dateStr).toLocaleTimeString("en-IN", {
    timeZone: INDIAN_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  });
}
