import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
await mkdir('verification', { recursive: true });
try {
  for (const viewport of [{width:1440,height:1000},{width:390,height:844}]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(process.env.TRACKER_URL || 'https://ship-happens-rho.vercel.app');
    await page.waitForFunction(() => getComputedStyle(document.body).backgroundColor === 'rgb(255, 255, 255)');
    await page.waitForFunction(() => document.querySelector('#data-status')?.textContent.includes('Updated'));
    assert.equal(await page.locator('[data-day]').count(), 28);
    assert.equal(await page.locator('#timeline .release-card').count(), 5);
    await page.locator('#search').fill('Decisions');
    assert.equal(await page.locator('#timeline .release-card').count(), 1);
    await page.locator('#search').fill('');
    await page.locator('#timeline [data-save]').first().click();
    await page.locator('[data-filter=saved]').click();
    assert.equal(await page.locator('#timeline .release-card').count(), 1);
    await page.locator('#timeline [data-save]').click();
    assert.equal(await page.locator('#saved-count').textContent(), '0');
    await page.locator('[data-filter=resets]').click();
    assert.match(await page.locator('#timeline').textContent(), /Reset pending/);
    assert.equal(await page.locator('#reset-score').textContent(), '0');
    await page.locator('[data-day="2"]').click();
    assert.equal(await page.locator('#day-detail .release-card').count(), 4);
    await page.getByRole('button', {name:'Close day details'}).click();
    await page.locator('[data-filter=all]').click();
    await page.locator('#refresh').click();
    await page.waitForFunction(() => !document.querySelector('#refresh').disabled);
    await page.locator('#celebrate').click();
    assert.match(await page.locator('#toast').textContent(), /Shipping/);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({path:`verification/live-${viewport.width}.png`,fullPage:true});
    assert.deepEqual(errors, []);
    console.log(`PASS ${viewport.width}px: storage, board, search, favorites, resets, dialog, refresh, celebration, overflow`);
    await page.close();
  }
} finally { await browser.close(); }
