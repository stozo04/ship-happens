import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dayNumber, normalizeSourceUrl, summarize, dayStatus } from '../lib/tracker.mjs';

test('challenge boundaries and calendar dates are exact', () => {
  assert.equal(dayNumber('2026-10-05'), 1);
  assert.equal(dayNumber('2026-10-06'), 2);
  assert.equal(dayNumber('2026-11-01'), 28);
  for (const value of ['2026-10-04', '2026-11-02', '2026-02-30', '2026-10-05T00:00:00Z', '', null]) {
    assert.equal(dayNumber(value), null);
  }
});

test('source URLs accept only actual X post paths and strip tracking', () => {
  assert.equal(normalizeSourceUrl('https://twitter.com/thsottiaux/status/2106845241357824205?utm_source=chatgpt#foo'), 'https://x.com/thsottiaux/status/2106845241357824205');
  assert.equal(normalizeSourceUrl('https://x.com/i/status/123/'), 'https://x.com/i/status/123');
  for (const url of ['https://x.com.evil.test/a/status/1', 'https://x.com@evil.test/a/status/1', 'https://user:pass@x.com/a/status/1', 'http://x.com/a/status/1', 'javascript:alert(1)', 'https://x.com/a', 'https://x.com/a/status/nope', 'https://x.com/a/status/1/photo/1', 'https://x.com:8080/a/status/1']) {
    assert.equal(normalizeSourceUrl(url), null);
  }
});

test('a day may ship and reset; missing ship and open polls are never resets', () => {
  const days = [
    { day: 1, ship_status: 'verified', reset_status: 'unconfirmed' },
    { day: 2, ship_status: 'verified', reset_status: 'confirmed' },
    { day: 3, ship_status: 'pending', reset_status: 'pending', poll_url: 'https://x.com/i/status/1' },
  ];
  assert.deepEqual(summarize(days, [{ day: 1 }, { day: 2 }, { day: 2 }]), { shippedDays: 2, totalReleases: 3, confirmedResets: 1 });
  assert.equal(dayStatus(days[0]), 'shipped');
  assert.equal(dayStatus(days[1]), 'shipped-and-reset');
  assert.equal(dayStatus(days[2]), 'pending');
  assert.equal(dayStatus({ ship_status: 'pending', reset_status: 'confirmed' }), 'reset');
});

test('seed preserves all 28 dates and the five source-backed releases', async () => {
  const seed = JSON.parse(await readFile(new URL('../data/seed.json', import.meta.url), 'utf8'));
  assert.equal(seed.days.length, 28);
  assert.deepEqual(seed.days.map(day => dayNumber(day.date)), Array.from({ length: 28 }, (_, i) => i + 1));
  assert.deepEqual(summarize(seed.days, seed.releases), { shippedDays: 2, totalReleases: 5, confirmedResets: 0 });
  assert.equal(seed.releases.filter(release => release.day === 2).length, 4);
  assert.equal(seed.days[1].reset_status, 'pending');
  for (const release of seed.releases) assert.equal(normalizeSourceUrl(release.source_url), release.source_url);
});
