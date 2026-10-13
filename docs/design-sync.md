# Design and code synchronization

GitHub is the shared source of truth for code and imported design exports. Claude's export/Sync workflow is currently manual; no automatic Claude design API or stable download URL has been provided.

## Bring in a handoff

```sh
git pull --ff-only
npm run design:sync -- /absolute/path/to/design.zip
# Also accepts an unzipped design folder.
npm run design:status
git diff
```

The importer validates the archive, locates the folder containing README.md and CLAUDE.md, replaces design/, copies design/CLAUDE.md exactly into root CLAUDE.md, and records file hashes in .design-sync.json. It prints additions, changes, and removals. It never edits src/ or selects variants. Review the root instruction changes before using them.

Read the imported README and references, then implement the approved sections in src/. Update docs/screen-map.json with actual source references and implementation status. Current choices are Hero B, Contact 1a, Footer 1b; these override any open choices in the original export.

```sh
npm run verify
git add design CLAUDE.md .design-sync.json src public docs
git commit -m "Sync design handoff and implementation"
git push origin main
```

Then use **Sync** in the Claude design workspace as described by the handoff. That action is outside this repository and is not performed by design:sync. Export updated designs and repeat. If we later receive a stable source URL, add a fetch step; do not pretend local file hashes can detect unpublished remote changes.

Do not edit exported design files to store implementation decisions. Keep decisions in docs/decisions.md and section mappings in docs/screen-map.json. Uncommitted code must be reviewed before pulling GitHub updates.
