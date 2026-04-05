export const formatLegacyInterviewDate = (date = new Date()) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
};

export const parseInterviewDateValue = (value) => {
  if (!value) {
    return 0;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const stringValue = String(value).trim();
  if (!stringValue) {
    return 0;
  }

  const legacyDateMatch = /^(\d{2})-(\d{2})-(\d{4})$/.exec(stringValue);
  if (legacyDateMatch) {
    const [, day, month, year] = legacyDateMatch;
    return new Date(Number(year), Number(month) - 1, Number(day)).getTime();
  }

  const parsed = new Date(stringValue).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const formatInterviewDateLabel = (value) => {
  const timestamp = parseInterviewDateValue(value);
  if (!timestamp) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp));
};

export const formatRelativeInterviewDate = (value) => {
  const timestamp = parseInterviewDateValue(value);
  if (!timestamp) {
    return "Recently";
  }

  const diffMs = Date.now() - timestamp;
  const absDiff = Math.abs(diffMs);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (absDiff < minute) {
    return "Just now";
  }

  if (absDiff < hour) {
    const minutes = Math.round(absDiff / minute);
    return `${minutes} minute${minutes === 1 ? "" : "s"} ${diffMs >= 0 ? "ago" : "from now"}`;
  }

  if (absDiff < day) {
    const hours = Math.round(absDiff / hour);
    return `${hours} hour${hours === 1 ? "" : "s"} ${diffMs >= 0 ? "ago" : "from now"}`;
  }

  const days = Math.round(absDiff / day);
  if (days <= 30) {
    return `${days} day${days === 1 ? "" : "s"} ${diffMs >= 0 ? "ago" : "from now"}`;
  }

  return formatInterviewDateLabel(timestamp);
};
