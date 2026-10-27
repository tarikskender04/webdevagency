// Prints Lupo download counts from the D1 database (one row per download, written by /lupo/download/).
// Uses your wrangler login (npx wrangler login), so no token is needed. Pass --local to read the local preview database.
import { execFileSync } from 'node:child_process';

const target = process.argv.includes('--local') ? '--local' : '--remote';
const queries = [
  'SELECT COUNT(*) AS downloads, MIN(downloaded_at) AS first FROM lupo_downloads',
  'SELECT version, COUNT(*) AS downloads FROM lupo_downloads GROUP BY version ORDER BY MAX(id) DESC',
  "SELECT substr(downloaded_at, 1, 7) AS month, COUNT(*) AS downloads FROM lupo_downloads GROUP BY month ORDER BY month DESC LIMIT 12",
  "SELECT substr(downloaded_at, 1, 10) AS day, COUNT(*) AS downloads FROM lupo_downloads WHERE downloaded_at >= strftime('%Y-%m-%d', 'now', '-29 days') GROUP BY day ORDER BY day DESC",
];

let output;
try {
  output = execFileSync('npx', ['wrangler', 'd1', 'execute', 'prodigy-stdio', target, '--json', '--command', queries.join('; ')], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
} catch (error) {
  console.error(String(error.stdout || error.stderr || error.message).trim());
  console.error('\nCouldn’t read the database. Run npx wrangler login, then try again.');
  process.exit(1);
}
const [[totals], byVersion, byMonth, byDay] = JSON.parse(output).map(result => result.results);

console.log(`Lupo downloads, all time: ${totals.downloads}${totals.first ? ` (since ${totals.first.slice(0, 10)})` : ''}`);
console.log('\nBy version:');
for (const row of byVersion) console.log(`  ${row.version.padEnd(10)} ${row.downloads}`);
console.log('\nBy month:');
for (const row of byMonth) console.log(`  ${row.month}    ${row.downloads}`);
console.log('\nLast 30 days (UTC):');
if (!byDay.length) console.log('  none');
for (const row of byDay) console.log(`  ${row.day}  ${row.downloads}`);
