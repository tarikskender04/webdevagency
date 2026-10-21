# Prodigy Stdio engineering instructions

Read root CLAUDE.md, design/README.md (when imported), docs/design-sync.md, and docs/decisions.md before changing the site.

- Stack: Astro static output, React, strict TypeScript. React components produce HTML at build time; hydrate only interactive components that need browser state.
- The original handoff lives in design/. Preserve it as the exported source. Implement components in src/ and assets in public/ or src/assets/.
- Confirmed variants: Hero B, Contact 1a, Footer 1b. Brand: Prodigy Stdio. Owned domain: prodigystdio.com; Stdio is intentional, do not change it to Studio. Name: Tarik Skender. Aladin Music handles Sales & Outreach. The user confirmed the other roles on 2026-10-21: Ishak Sacirbey, UI/UX Designer; Haris Sušić, Software Engineer; Kemal Mešić, Frontend Engineer (src/config/site.ts).
- Do not invent clients, reviews, metrics, team roles, a registered company, or a US office. Prodigy Stdio is based in Sarajevo, Bosnia and Herzegovina (Gradačačka 118, 71000 Sarajevo), confirmed by the user on 2026-10-21; it replaces the earlier Chicago description, which must not return. There is no registered business.
- Business identity and content are centralized in src/config/site.ts. Replace handoff placeholder identities with confirmed details.
- Keep meaningful content in the built HTML. Use semantic headings, accessible navigation, responsive styling, and reduced-motion support.
- Noindex is the setup default. Set PUBLIC_SITE_URL to the real production HTTPS origin and PUBLIC_SITE_INDEXABLE=true only when ready to launch. Preview deployments must retain noindex.
- Use the project SEO/GEO/AEO skill for explicit audits. Skill guidance is advisory; verify claims about rich-result eligibility against current Google documentation. Installation does not require an audit during project setup.
- Before committing application changes, run npm run verify. Update docs/screen-map.json when design sections are implemented. Importing a design is not evidence it is implemented.
- Use .claude/skills/frontend-engineer/SKILL.md for frontend work and npm run test:browser for browser verification. Screenshots live in ignored artifacts/ and are uploaded by CI.
- Crochê, Tierd, Una Adventure, and Captured are confirmed clients. The numerical results and dates in the original handoff are not real and must not be used in production copy.
- Booking requires a real PUBLIC_BOOKING_URL. Until it is provided, the form prepares a local downloadable brief and explicitly says nothing was sent or booked.
- Tarik Skender is the confirmed legal operator and Owner & CEO. The public enquiry/privacy email is hello@prodigystdio.com, an alias of tarik@prodigystdio.com (Google Workspace). Hosting is Cloudflare Workers; only /api/enquiry/ runs on demand, everything else is prerendered. Enquiry delivery needs RESEND_API_KEY on the host and PUBLIC_ENQUIRY_ENABLED=true at build time. Privacy and Terms remain drafts until the missing address, hosting, retention and transfer details in src/config/site.ts are confirmed; see docs/legal-launch.md.
- The importer copies design/CLAUDE.md exactly into root CLAUDE.md. Keep durable engineering instructions here to avoid losing them on future imports.
