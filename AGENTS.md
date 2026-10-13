# Meridian engineering instructions

Read root CLAUDE.md, design/README.md (when imported), docs/design-sync.md, and docs/decisions.md before changing the site.

- Stack: Astro static output, React, strict TypeScript. React components produce HTML at build time; hydrate only interactive components that need browser state.
- The original handoff lives in design/. Preserve it as the exported source. Implement components in src/ and assets in public/ or src/assets/.
- Confirmed variants: Hero B, Contact 1a, Footer 1b. Brand: Meridian. Name: Tarik Skender. Aladin Music handles Sales & Outreach. Other employee names are in src/config/site.ts; roles remain unconfirmed.
- Do not invent clients, reviews, metrics, team roles, a US office, or a contact email. Target the US market without claiming a US location.
- Business identity and content are centralized in src/config/site.ts. Replace handoff placeholder identities with confirmed details.
- Keep meaningful content in the built HTML. Use semantic headings, accessible navigation, responsive styling, and reduced-motion support.
- Noindex is the setup default. Set PUBLIC_SITE_URL to the real production HTTPS origin and PUBLIC_SITE_INDEXABLE=true only when ready to launch. Preview deployments must retain noindex.
- Use the project SEO/GEO/AEO skill for explicit audits. Skill guidance is advisory; verify claims about rich-result eligibility against current Google documentation. Installation does not require an audit during project setup.
- Before committing application changes, run npm run verify. Update docs/screen-map.json when design sections are implemented. Importing a design is not evidence it is implemented.
- The importer copies design/CLAUDE.md exactly into root CLAUDE.md. Keep durable engineering instructions here to avoid losing them on future imports.
