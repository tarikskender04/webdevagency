// Builds the hero deck's client-card layers in src/assets/work from the supplied showcase thumbnails
// (src/assets/standout/*.zip and Tierd's Thumbnail.dc.html). Photos are cropped to the cards' 3:4 frame.
// Type set in the clients' own display faces (Bricolage Grotesque, Boldonse, Big Shoulders Display) is baked
// into transparent 900×1200 layers at 2x, so the site never loads those fonts. Run: node scripts/render-work-cards.ts
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const source = 'src/assets/standout';
const out = 'src/assets/work';
const tmp = mkdtempSync(join(tmpdir(), 'work-cards-'));
mkdirSync(out, { recursive: true });
for (const zip of ['Crochê.zip', 'Una Adventure.zip', 'Captured Social Redesign.zip']) execFileSync('unzip', ['-q', '-o', join(source, zip), '-d', tmp]);
const exported = (path: string): string => join(tmp, 'export', path);

// Crochê: centre 3:4 crop of the 9:16 photo, plus the white primary logo as supplied.
const crochePhoto = exported('croche-thumbnail/assets/croche-hero.png');
const { width = 0, height = 0 } = await sharp(crochePhoto).metadata();
const cropHeight = Math.round(width * 4 / 3);
await sharp(crochePhoto).extract({ left: 0, top: Math.round((height - cropHeight) / 2), width, height: cropHeight }).resize(1200).jpeg({ quality: 86, mozjpeg: true }).toFile(join(out, 'croche-photo.jpg'));
copyFileSync(exported('croche-thumbnail/assets/croche-logo-white.svg'), join(out, 'croche-logo-white.svg'));
// Una Adventure: the finished poster; the site animates its river over the top.
copyFileSync(exported('una-adventure.png'), join(out, 'una-poster.png'));
// Captured: the 3:4 window the thumbnail shows (object-fit: cover at 70% 50%), for the photo and the bowl cut-out alike.
const frame = { left: 683, top: 0, width: 703, height: 937 };
await sharp(exported('captured-thumbnail/lightmode.png')).extract(frame).jpeg({ quality: 88, mozjpeg: true }).toFile(join(out, 'captured-photo.jpg'));
await sharp(exported('captured-thumbnail/day-layer.png')).extract(frame).png().toFile(join(out, 'captured-bowl.png'));

const fonts = '<link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@900&family=Boldonse&family=Bricolage+Grotesque:opsz,wght@12..96,800&display=block" rel="stylesheet">';
const art = 'html,body{margin:0;background:transparent}#art{position:relative;width:900px;height:1200px;overflow:hidden}';
const tierd = (show: 'type' | 'dot'): string => `<style>${art}#art{display:flex;align-items:center;justify-content:center;color:${show === 'type' ? '#F1EBDF' : 'transparent'}}
  .stack{display:flex;flex-direction:column;align-items:center;gap:56px}.dot{color:${show === 'dot' ? '#FF5A1F' : 'transparent'}}</style>
  <div id="art"><div class="stack"><div style="font:400 360px/1.3 Boldonse;letter-spacing:-.06em">t<span class="dot">.</span></div>
  <div style="font:800 96px/1 'Bricolage Grotesque';letter-spacing:-.03em">tierd<span class="dot">.</span></div></div></div>`;
const badge = (background: string, body: string): string => `<style>html,body{margin:0;background:transparent}
  #art{width:96px;height:96px;display:grid;place-items:center;background:${background}}</style><div id="art">${body}</div>`;
const corner = (side: string, color = '#0E0E12'): string => `<i style="position:absolute;width:13px;height:13px;border:0 solid ${color};${side}"></i>`;
const layers: Record<string, string> = {
  // The wordmark sits behind the bowl; its corner brackets are drawn live so they can focus in.
  'captured-wordmark': `<style>${art}#art div{position:absolute;left:0;right:0;top:300px;display:flex;justify-content:center}
    h1{margin:0;padding:34px 40px;font:800 150px/.82 'Bricolage Grotesque';letter-spacing:-.055em;white-space:nowrap;color:#0E0E12}</style>
    <div id="art"><div><h1>CAPTURED</h1></div></div>`,
  'tierd-type': tierd('type'),
  'tierd-dot': tierd('dot'),
  // Corner badges, one per client, from each brand's own mark.
  'croche-badge': badge('#7B1E3A', `<img src="data:image/svg+xml;base64,${readFileSync('design/prototypes/assets/croche/logo-mark-white.svg').toString('base64')}" style="width:62px;margin:0 0 2px 4px">`),
  'una-badge': badge('#1F4D38', `<span style="font:900 50px/1 'Big Shoulders Display';color:#EA5A12;letter-spacing:.01em;padding-top:3px">UA</span>`),
  'tierd-badge': badge('#15110D', `<span style="font:400 40px/1 Boldonse;color:#F1EBDF;letter-spacing:-.06em;padding:0 0 4px 6px">t<span style="color:#FF5A1F">.</span></span>`),
  'captured-badge': badge('#FFFFFF', `<span style="position:relative;padding:9px 11px;font:800 42px/.82 'Bricolage Grotesque';letter-spacing:-.05em;color:#0E0E12">C
    ${corner('left:0;top:0;border-top-width:3px;border-left-width:3px')}${corner('right:0;top:0;border-top-width:3px;border-right-width:3px')}
    ${corner('left:0;bottom:0;border-bottom-width:3px;border-left-width:3px')}${corner('right:0;bottom:0;border-bottom-width:3px;border-right-width:3px', '#FF2D8A')}</span>`),
};

const localChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({ headless: true, ...(existsSync(localChrome) ? { executablePath: localChrome } : {}) });
try {
  const page = await browser.newPage({ deviceScaleFactor: 2 });
  for (const [name, body] of Object.entries(layers)) {
    await page.setContent(`<!doctype html><meta charset="utf-8">${fonts}${body}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.locator('#art').screenshot({ path: join(out, `${name}.png`), omitBackground: true });
  }
} finally {
  await browser.close();
  rmSync(tmp, { recursive: true, force: true });
}
