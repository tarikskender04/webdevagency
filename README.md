# Meridian

An agency website built with Astro, React, and strict TypeScript. Marketing content is generated as HTML; interactive React components can be hydrated where needed.

## Start in VS Code

Node.js 24 is recommended (minimum 22.12). Python 3 is required only for importing design exports.

```sh
npm ci
npm run dev
```

Open http://localhost:4321. Install the recommended Astro VS Code extension.

```sh
npm run verify    # Type checks, production build, rendered SEO checks
npm run preview   # Preview dist/ locally
```

## Design handoffs

```sh
npm run design:sync -- /path/to/design.zip
npm run design:status
```

The first 50-file handoff is imported in design/. The importer stores the original export, copies its CLAUDE.md into the root, and records hashes. Read [the sync workflow](docs/design-sync.md). Selected variants: **Hero B, Contact 1a, Footer 1b**. [Confirmed business details](docs/decisions.md) override export placeholders. The current page is a temporary starter with the Hero B headline and self-hosted design fonts. Full section implementation follows this setup.

To continue in Claude Code or Codex: "Read AGENTS.md, docs/decisions.md, and design/README.md. Build Hero B from its prototype and update docs/screen-map.json."

## Search and launch

Copy .env.example to .env locally; set the real production URL before launch. Preview content defaults to noindex. See [the launch checklist](docs/seo-launch.md) and [installed SEO skill](docs/seo-skill.md). GitHub Actions checks both preview and production SEO output; the CI domain is a test fixture, never a deployment target.

## Project map

- src/components/ — React TypeScript sections.
- src/layouts/BaseLayout.astro — shared HTML and metadata.
- src/config/site.ts — identity, content, team, and design choices.
- src/pages/ — Astro routes, 404, and robots.txt.
- src/styles/ — shared styles and design tokens.
- design/ — original Claude handoff, kept separate from implementation.
- docs/screen-map.json — design section to source mapping and status.
- AGENTS.md — engineering guidance shared across assistants.

Deploy dist/ to any static host using npm run build. Configure the production environment there; this setup does not publish a live website.
