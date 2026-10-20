// Render the brand's vector masters to standalone SVG and transparent PNG files.
// Run from the repository root: node scripts/render-brand-assets.mjs
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const output = new URL('../public/brand/', import.meta.url);
const mark = await readFile(new URL('../src/assets/brand/mark.svg', import.meta.url), 'utf8');
const wordmark = await readFile(new URL('../src/assets/brand/wordmark.svg', import.meta.url), 'utf8');
const ink = '#0A1A25';
const white = '#FFFFFF';
const body = (svg) => svg.replace(/^[\s\S]*?<svg\b[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<title\b[^>]*>[\s\S]*?<\/title>/g, '');
const plainMark = (color) => body(mark).replace(/<defs>[\s\S]*?<\/defs>/, '').replace(/fill="url\(#[^)]+\)"/g, `fill="${color}"`);
const lettering = (color) => body(wordmark).replaceAll(ink, color);
const svg = (title, width, height, content) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-labelledby="title">\n<title id="title">${title}</title>\n${content}\n</svg>\n`;

// The supplied artwork contains separate symbol and lettering images. This new
// horizontal arrangement keeps their proportions, with the lettering centered.
const lockup = (color, monochrome = false) => svg('Prodigy Stdio', 2300, 430,
  `<g transform="scale(.47672)">${monochrome ? plainMark(color) : body(mark)}</g>\n<g transform="translate(370 44)">${lettering(color)}</g>`);
const variants = [
  ['mark', svg('Prodigy Stdio symbol', 692, 902, body(mark))],
  ['mark-ink', svg('Prodigy Stdio symbol', 692, 902, plainMark(ink))],
  ['mark-white', svg('Prodigy Stdio symbol', 692, 902, plainMark(white))],
  ['wordmark', svg('Prodigy Stdio', 1930, 342, lettering(ink))],
  ['wordmark-white', svg('Prodigy Stdio', 1930, 342, lettering(white))],
  ['logo', lockup(ink)],
  ['logo-ink', lockup(ink, true)],
  ['logo-white', lockup(white)],
];

await mkdir(output, { recursive: true });
const exports = [];
for (const [name, content] of variants) {
  const filename = `prodigy-stdio-${name}`;
  await writeFile(new URL(`${filename}.svg`, output), content);
  // Render vectors at a useful sharing size; every PNG has a transparent canvas.
  const width = name.startsWith('mark') ? 1384 : 2400;
  await sharp(Buffer.from(content)).resize({ width }).png().toFile(new URL(`${filename}.png`, output).pathname);
  exports.push(`${filename}.svg`, `${filename}.png`);
  console.log(`Created ${filename}.svg and .png`);
}

// A dark tile gives the white folded face a clear edge at small browser sizes.
const favicon = svg('Prodigy Stdio', 64, 64,
  `<rect width="64" height="64" rx="12" fill="${ink}"/>\n<g transform="translate(13.6 8) scale(.0532)">${body(mark)}</g>`);
await writeFile(new URL('../favicon.svg', output), favicon);
await sharp(Buffer.from(favicon)).resize(180, 180).png().toFile(fileURLToPath(new URL('../apple-touch-icon.png', output)));

const archive = new URL('prodigy-stdio-brand-kit.zip', output);
await rm(archive, { force: true });
execFileSync('zip', ['-q', fileURLToPath(archive), 'README.md', ...exports], { cwd: fileURLToPath(output) });
console.log('Created prodigy-stdio-brand-kit.zip');
