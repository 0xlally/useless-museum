// Capture real renders of the six permanent exhibits for the collection cards.
// Requires the built site and the local API server on 8787 with cached models.
//
// Usage: node scripts/capture-thumbs.mjs
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const IDS = ['shadow', 'yawn', 'coffee', 'dust', 'wait', 'monday'];
const ORIGIN = process.env.ORIGIN || 'http://127.0.0.1:8787';
const OUT = path.resolve('public', 'thumbs');
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
const errors = [];
page.on('pageerror', e => errors.push(e.message));

await page.goto(ORIGIN, { waitUntil: 'networkidle' });
await page.waitForFunction(() => document.querySelectorAll('.exhibit-card').length >= 6, null, { timeout: 30000 });

for (const id of IDS) {
  await page.goto(`${ORIGIN}/#exhibit=${id}`, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: '.stage-top,.stage-bottom,.inspector,.scene-caption,.peek,.gal-tip,.hint,.walk,.stage-watermark,.stage-loader,.spotlight-cone,.gal-card{display:none!important}' });
  await page.waitForFunction(() => /Lux3D 生成模型/.test(document.querySelector('#asset-status')?.textContent || ''), null, { timeout: 45000 });
  await page.waitForTimeout(350);
  const scene = page.locator('#scene');
  await scene.screenshot({ path: path.join(OUT, `${id}.jpg`), type: 'jpeg', quality: 84, animations: 'disabled' });
  console.log('captured', id);
}
await browser.close();
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('Portrait card renders written to public/thumbs/.');
