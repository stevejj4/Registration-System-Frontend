/**
 * Safe date parsing for API strings (ISO-8601, yyyy-MM-dd, legacy formats).
 */
export function parseApiDate(value: unknown): Date | null {
  if (value == null || value === "") {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const raw = String(value).trim();
  if (!raw) {
    return null;
  }

  // ISO / standard
  let parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  // yyyy-MM-dd (date-only) — treat as local midnight
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    parsed = new Date(`${raw}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  // Some engines choke on dashes in datetime without T
  if (raw.includes(" ") && !raw.includes("T")) {
    parsed = new Date(raw.replace(" ", "T"));
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  // Safari-friendly: replace dashes with slashes for date part only
  const slashVariant = raw.replace(/(\d{4})-(\d{2})-(\d{2})/, "$1/$2/$3");
  if (slashVariant !== raw) {
    parsed = new Date(slashVariant);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}

export function formatTimeAgo(timestamp: unknown): string {
  const past = parseApiDate(timestamp);
  if (!past) {
    return "Date unavailable";
  }

  const now = new Date();
  const diffMs = now.getTime() - past.getTime();
  if (diffMs < 0) {
    return "Just now";
  }

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 1) {
    return "Just now";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return `${diffMonths} month${diffMonths === 1 ? "" : "s"} ago`;
  }

  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears} year${diffYears === 1 ? "" : "s"} ago`;
}

export function isSameCalendarMonth(date: Date, reference: Date = new Date()): boolean {
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth()
  );
}

export function formatDisplayDate(value: unknown): string {
  const d = parseApiDate(value);
  if (!d) {
    return "—";
  }
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
