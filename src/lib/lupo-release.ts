import { existsSync } from 'node:fs';
import { join } from 'node:path';
import updates from '../../public/lupo/updates.json';

/** Lupo's release files, written into public/lupo/ by Lupo's release script (docs/lupo-releases.md).
 *  Read at build time only. Installed copies of the app read the same updates.json, so a malformed file fails the build
 *  rather than shipping. */
export interface LupoRelease { version: string; date: string; notes: string[]; }

const fields = ['version', 'build', 'date', 'minimumSystem', 'url', 'sha256', 'notes', 'releases'] as const;
for (const field of fields) if (!(field in updates)) throw new Error(`public/lupo/updates.json is missing "${field}".`);
const [newest] = updates.releases;
if (!newest || newest.version !== updates.version || newest.date !== updates.date) {
  throw new Error('public/lupo/updates.json: the first entry of "releases" must match the top-level version and date.');
}

export const lupoReleases: LupoRelease[] = updates.releases;
export const lupoLatest: LupoRelease = newest;
export const lupoMinimumSystem = updates.minimumSystem;

/** The DMG is the one file the page can't do without: until the release script has written it, the page says Coming soon. */
const dmg = join(process.cwd(), 'public/lupo/Lupo.dmg');
export const lupoDownload = existsSync(dmg) ? { href: '/lupo/download/' } : undefined;

/** "2026-10-25" → "25 October 2026", read as a calendar date so no time zone can shift it. */
export function formatReleaseDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}
