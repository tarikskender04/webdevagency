# Lupo release files

Lupo's release script (in the Lupo repo) writes these files into `public/lupo/`. Commit and deploy
the site to publish a release. The paths and the shape of `updates.json` are a contract with every
installed copy of Lupo: once published, don't rename, move or remove a field.

| Path | What it is |
|---|---|
| `/lupo/Lupo.dmg` | The latest version, always at this name. The page's Download button points here (through `/lupo/download/`, which counts the download and redirects). Until this file exists, the page shows "Coming soon" instead of the button. |
| `/lupo/updates.json` | The latest version and the release history. The app reads it to update itself; the page reads it at build time for the version and "What's new". |
| `/lupo/releases/Lupo-<version>.zip` | The zipped `Lupo.app` for the in-app updater. Only the latest one is needed; older zips can be deleted. |

## updates.json

```json
{
  "version": "0.2.0",
  "build": 2,
  "date": "2026-11-02",
  "minimumSystem": "26.0",
  "url": "https://prodigystdio.com/lupo/releases/Lupo-0.2.0.zip",
  "sha256": "<hex SHA-256 of that zip>",
  "notes": ["Arrows snap to the nearest window."],
  "releases": [
    { "version": "0.2.0", "date": "2026-11-02", "notes": ["Arrows snap to the nearest window."] },
    { "version": "0.1.0", "date": "2026-10-25", "notes": ["First public release."] }
  ]
}
```

- **Top level** is what the app reads: `version` (`CFBundleShortVersionString`), `build`
  (`CFBundleVersion`, an integer that only goes up; the app compares this), `date` (`YYYY-MM-DD`),
  `minimumSystem` (`LSMinimumSystemVersion`), `url` (absolute URL of the zip) and `sha256` (the
  updater checks the zip against it before installing). `notes` is the latest release's notes.
  `notesMarkdown` (optional, from Lupo 0.1.2) is the same notes with their `##` headings and bold
  titles, for the app's update window; `notes` stays one plain line per change. Entries in
  `releases` carry it too, so the app can list every version someone skipped.
- **`releases`** is the history, newest first, and only the page reads it. Each release adds its
  entry at the top; the first entry always matches the top level.
- Notes are plain sentences, one change each, written for users. They appear on the page verbatim.
- The build fails if the file is missing a field or the first entry of `releases` doesn't match the
  top level (`src/lib/lupo-release.ts`), so a broken file never reaches installed apps.

The committed file is a placeholder until the first real release: `sha256` is empty, and the
zip and DMG don't exist yet.

## Keep in mind

- **Sign every release with the same identity** ("Live Context Dev"). macOS ties the Microphone and
  Screen Recording permissions to the signature, so a new identity makes every user grant them again
  after the update. Back up that identity (export it as a .p12) before the first public release.
- Lupo isn't notarized, so the page's first-launch steps (Open Anyway) apply to the DMG. The in-app
  updater should download without setting the quarantine flag, so updates open without that step;
  the page promises "you won't see this again".
