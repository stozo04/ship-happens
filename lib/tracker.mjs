const START = Date.UTC(2026, 9, 5);
const DAY_MS = 86_400_000;

/** Calendar date only: avoids timezone drift and rejects impossible dates. */
export function dayNumber(dateString) {
  if (typeof dateString !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return null;
  const timestamp = Date.parse(`${dateString}T00:00:00.000Z`);
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== dateString) return null;
  const day = (timestamp - START) / DAY_MS + 1;
  return day >= 1 && day <= 28 ? day : null;
}

/** Returns a canonical post URL or null. External redirects are never accepted. */
export function normalizeSourceUrl(value) {
  if (typeof value !== 'string') return null;
  let url;
  try { url = new URL(value); } catch { return null; }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
  if (!['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'].includes(url.hostname)) return null;
  const match = url.pathname.match(/^\/(?:([A-Za-z0-9_]{1,15})\/status|i\/status)\/(\d{1,20})\/?$/);
  if (!match) return null;
  return `https://x.com/${match[1] || 'i'}/status/${match[2]}`;
}

/** Shipping and delivered usage resets are independent facts. */
export function summarize(days, releases) {
  return {
    shippedDays: new Set(days.filter(day => day.ship_status === 'verified').map(day => day.day)).size,
    totalReleases: releases.length,
    confirmedResets: new Set(days.filter(day => day.reset_status === 'confirmed').map(day => day.day)).size,
  };
}

/** Absence of a release never proves a reset. A poll never proves delivery. */
export function dayStatus(day) {
  const shipped = day.ship_status === 'verified';
  const reset = day.reset_status === 'confirmed';
  if (shipped && reset) return 'shipped-and-reset';
  if (reset) return 'reset';
  if (shipped) return 'shipped';
  return 'pending';
}
