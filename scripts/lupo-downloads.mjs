// Prints Lupo download counts from Workers Analytics Engine (written by /lupo/download/).
// Needs CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_ANALYTICS_TOKEN (an API token with Account Analytics: Read), from the
// environment or a gitignored .env.cloudflare. Cloudflare keeps the data for three months.
const account = process.env.CLOUDFLARE_ACCOUNT_ID;
const token = process.env.CLOUDFLARE_ANALYTICS_TOKEN;
if (!account || !token) {
  console.error('Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_ANALYTICS_TOKEN (see .env.cloudflare.example).');
  process.exit(1);
}

/** Analytics Engine may sample busy datasets; _sample_interval weights each row back to the true count. */
async function query(sql) {
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/analytics_engine/sql`, {
    method: 'POST', headers: { authorization: `Bearer ${token}` }, body: `${sql} FORMAT JSON`,
  });
  const text = await response.text();
  // A valid token is also refused until the account has Analytics Engine, which arrives with the first deploy of the
  // LUPO_DOWNLOADS binding (2026-10-25: token and account ID checked fine through the GraphQL API, SQL still 403).
  if (response.status === 403) {
    console.error('Cloudflare refused the query (403). If the site hasn’t been deployed with the download counter yet, deploy first: Analytics Engine switches on with it.');
    console.error('Still 403 after a deploy? Search “Analytics Engine” in the dashboard’s Quick search and turn it on there, then check the token is Account → Account Analytics → Read.');
    process.exit(1);
  }
  if (!response.ok) throw new Error(`Cloudflare answered ${response.status}: ${text}`);
  return JSON.parse(text).data;
}

const window = "timestamp > NOW() - INTERVAL '90' DAY";
const byVersion = await query(`SELECT blob1 AS version, SUM(_sample_interval) AS downloads FROM lupo_downloads WHERE ${window} GROUP BY version ORDER BY version DESC`);
const byDay = await query(`SELECT toStartOfInterval(timestamp, INTERVAL '1' DAY) AS day, SUM(_sample_interval) AS downloads FROM lupo_downloads WHERE timestamp > NOW() - INTERVAL '14' DAY GROUP BY day ORDER BY day DESC`);

const total = byVersion.reduce((sum, row) => sum + Number(row.downloads), 0);
console.log(`Lupo downloads, last 90 days: ${total}`);
for (const row of byVersion) console.log(`  ${row.version.padEnd(10)} ${row.downloads}`);
console.log('\nLast 14 days:');
if (!byDay.length) console.log('  none yet');
for (const row of byDay) console.log(`  ${String(row.day).slice(0, 10)}  ${row.downloads}`);
