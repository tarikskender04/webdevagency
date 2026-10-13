# Design rules (copy this block into the repo-root CLAUDE.md)

- `/design` is the design source of truth. It is exported from the Claude Design project "Web Design Kit System". Don't edit files in `/design` by hand; they get replaced on each design handoff.
- Visual decisions come from `/design/README.md`, `/design/tokens.css` and the prototypes in `/design/prototypes`. Don't invent colours, fonts, radii, shadows or motion. If something is missing, flag it rather than improvising.
- The prototypes are references. Rebuild them in the site's framework. Don't ship the `.dc.html` files or `support.js`.
- Copy is final. Use it verbatim unless told otherwise.
- When a new handoff arrives, read `/design/CHANGELOG.md` and apply only what changed.
- Every animation must respect `prefers-reduced-motion` and resolve to its end state.
