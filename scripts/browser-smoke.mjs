import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, readFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const outputDir=process.env.VERIFICATION_DIR || 'verification';
await mkdir(outputDir, { recursive: true });
try {
  for (const viewport of [{width:1440,height:1000},{width:390,height:844}]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const trackerUrl=process.env.TRACKER_URL || 'https://ship-happens-rho.vercel.app';
    if(process.env.LOCAL_BUILD){for(const asset of ['index.html','styles.css','clean.css','app.mjs']){await page.route(new URL(asset==='index.html'?'/':`/${asset}`,trackerUrl).href,async route=>route.fulfill({body:await readFile(`dist/${asset}`),contentType:asset.endsWith('.css')?'text/css':asset.endsWith('.mjs')?'text/javascript':'text/html'}));}}
    await page.goto(trackerUrl);
    await page.waitForFunction(() => getComputedStyle(document.body).backgroundColor === 'rgb(255, 255, 255)');
    await page.waitForFunction(() => document.querySelector('#data-status')?.textContent.includes('Updated'));
    assert.equal(await page.locator('[data-day]').count(), 28);
    assert.equal(await page.locator('#timeline .release-card').count(), 5);
    await page.locator('#search').fill('Decisions');
    assert.equal(await page.locator('#timeline .release-card').count(), 1);
    await page.locator('#search').fill('');
    assert.equal(await page.locator('[data-save], [data-filter=saved], .verified, #release-heading').count(), 0);
    assert.equal(await page.locator('#timeline .release-heading .source-link').count(), 5);
    const categoryColors=await page.locator('#timeline .category').evaluateAll(items=>[...new Set(items.map(e=>getComputedStyle(e).backgroundColor))]);
    assert.equal(categoryColors.length, 4);
    await page.locator('[data-filter=resets]').click();
    assert.match(await page.locator('#timeline').textContent(), /Reset pending/);
    assert.equal(await page.locator('#reset-score').textContent(), '0');
    await page.locator('[data-day="2"]').click();
    assert.equal(await page.locator('#day-detail .release-card').count(), 4);
    await page.getByRole('button', {name:'Close day details'}).click();
    await page.locator('[data-filter=all]').click();
    await page.locator('#refresh').click();
    await page.waitForFunction(() => !document.querySelector('#refresh').disabled);
    assert.equal(await page.locator('#celebrate, .hero-description, #confetti').count(), 0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({path:`${outputDir}/live-${viewport.width}.png`,fullPage:true});
    assert.deepEqual(errors, []);
    console.log(`PASS ${viewport.width}px: storage, board, search, compact rows, category colors, resets, dialog, refresh, minimal hero, overflow`);
    await page.close();
  }
} finally { await browser.close(); }
