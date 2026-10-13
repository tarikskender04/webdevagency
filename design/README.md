# Handoff: Meridian studio website

## Overview
Marketing site for a small web studio (working name **Meridian**, not final). It's one long page made of five sections: **Hero → Capabilities → Process → Contact → Footer**. The Capabilities and Process sections tell a single case study (Crochê, a one-woman bag studio in Sarajevo) through animated product mock-ups.

## About the design files
The files in `prototypes/` are **design references built in HTML**. They're prototypes that show the intended look and behaviour, not production code. They run on a lightweight design runtime (`support.js`, `<x-dc>` tags, inline styles), so don't ship them.

**The task:** rebuild these designs in the repo's framework. No framework has been chosen yet. For a marketing site with heavy scroll motion and a few WebGL effects, the recommendation is **Astro** (static HTML, React islands only where needed) with plain CSS or CSS modules driven by `tokens.css`. Next.js is fine if the site will grow into an app.

To view a prototype, serve the `prototypes/` folder (`npx serve design/prototypes`) and open the `.dc.html` file. Opening it as `file://` won't work.

## Fidelity
**High-fidelity.** Colours, type, spacing, copy and motion are final unless the CHANGELOG lists them as open. Recreate them pixel-accurately.

## Open decisions (don't build both, ask)
- **Hero:** `Hero.dc.html` (A, the current lead) or `Hero B.dc.html` (B, work deck).
- **Contact:** option 1a (light) or 1b (dark) in `Contact.dc.html`.
- **Footer:** option 1a (light) or 1b (dark) in `Footer.dc.html`. Footer 1a pairs with Contact 1a, and 1b with 1b.
- **Name:** "Meridian" is a placeholder. Keep it in one constant.
- **Host:** "Alex Moreno" and `hello@meridian.agency` are placeholders.

---

## Global rules (from `Design Kit.dc.html`)
- Light only. The page background is paper `#FFFFFF`. Ink `#0A1A25` is used for all text, never `#000`.
- **Instrument Sans** carries everything (400/500/600). **Newsreader italic** is the accent: one phrase per headline, never a whole line. **JetBrains Mono** is for uppercase labels (11–12px, +0.12–0.14em). **Hanken Grotesk 800** is used only for the Hero H1 and the wordmark.
- Use a 12-column grid with a 1240px max width and 32px gutters. Everything sits on a 4px rhythm.
- Radii: cards 20, panels 24, media/hero 28, and every control is a full pill (999).
- Buttons are always pills. On hover they change colour and lift 1px over 220ms ease. Nothing bounces.
- Glass appears in two places only: the floating nav and a panel over imagery. Never put glass on glass, and use refraction only on the nav.
- Imagery is rendered objects on white: one object per view, no drop shadows, and the object is the only saturated thing on screen.
- Every motion behaviour resolves instantly to its end state under `prefers-reduced-motion`.

## Sections

### 1. Hero (`Hero.dc.html`, option A)
- **Layout:** full viewport (`100vh`, min 780px). Background `linear-gradient(180deg,#EFF7FD,#E8F3FC 40%,#DCEEFA)`. A full-bleed image plate (`uploads/pasted-1789954960628-0.png`, cover, positioned at 50% 100%) is masked so it fades in from the top.
- **Nav row:** padding `26px clamp(20px,4vw,56px)`. Mark (58×22 crop) + "Meridian" in Hanken Grotesk 800 at 23px, -0.03em. Links Work / Studio / Process / Journal, 15px `#2C3E4A`, hover `#0C7CC4`. CTA pill on the right: 46px tall, `#0C7CC4`, white 15/600, label "Start a project →", hover `#084B7A`.
- **H1:** Hanken Grotesk 800 at `6.4vw`, line-height 1.06, -0.038em, one line. Copy: "We don't just shift **colors.**" The word "colors." sits on a lime highlight `#C2E62A` (radius 6). Second line, at 0.705em, weight 500, `#2C3E4A`: "We change the way people see your brand."
- **Sub:** "Strategy, design, and digital experiences for brands that want a brighter tomorrow." clamp(15px,1.2vw,18px), `#33454F`, max 40ch.
- **CTAs:** a primary pill (56px tall, 17/600, shadow `0 14px 34px rgba(12,124,196,.26)`) plus an underlined text link "See our work".
- **Bottom row:** a 34px rule, then Brands · People · Progress in mono at 12px/+0.18em. On the right, "Scroll ↓" with a bobbing arrow.
- **Motion:** each word rises in (`translateY(.42em)`→0, 800ms, ease `cubic-bezier(.22,.61,.36,1)`, stagger 60ms starting at 50ms). Sub, CTAs and bottom row fade up 10px at 500/600/800ms. The image plate parallaxes against the pointer (±14px x, ±9px y) and scroll (0.14× scrollY) at scale 1.03, throttled with rAF.

### 2. Capabilities (`Capabilities.dc.html`)
- **Purpose:** "What we build", a horizontal track of five live product screens built for Crochê. The track scrubs with vertical scroll (pinned), and the user can also drag or swipe it.
- **Cards:** 01 Brand identity · 02 Online ordering · 03 Content editing · 04 Owner's dashboard · 05 Customer emails. Each pairs a short text block with an interactive mock (a browser-chrome frame on a warm Crochê palette: `#F4F0E9` / `#14110F`, wine accent `#7B1E3A`, Bodoni Moda + Archivo + DM Mono).
- **Closing line + industry marquee:** Bakeries, Cafés, Barbers, Salons, Dental clinics, Restaurants, Boutiques, Florists, Gyms, Hotels, Retail chains, then the "Start a project" CTA.
- The mocks autoplay their own demo loops (state machines in the logic class). Read the prototype source for exact copy and states. It's the longest file and the most detailed spec.
- Props in the prototype: `autoplay`, `zoom` (Subtle/Normal/Close), `tilt`, `mode` (Scrub/Swipe). Ship with autoplay on, Subtle zoom, tilt on, and Scrub.

### 3. Process (`Process.dc.html`)
- **Head:** a "How the work happens" label, the H2 "From a pencil line to *thousands of orders*" (clamp 36–68px, -0.035em) and a lead paragraph.
- **Rows:** five alternating text/visual rows (`// 01`–`// 05`): Plan it *out*, Take it *digital*, Engineer *it*, Polish *it*, Ship *it*. A 1px centre spine fills with an azure gradient as you scroll (hidden under 920px). Each row has a dot that turns azure on enter.
- **Visuals:** 01 is a paper notebook with sticker images drawn in by a moving pencil dot. 02 is a design-system card. 03 is a browser mock with code that types itself. 04 is a review panel with tabs (Ready / At launch / Loading) cycling every 2.8s. 05 is a launch dashboard with counters. Each card ends in a glass strip that slides up.
- **Closing band:** "At every phase we are fully with you, providing only the *best*." plus an ink CTA pill.
- **Motion (GSAP + ScrollTrigger + Lenis):** text bits fade up 30px with x -14 × direction (800ms, stagger 85ms, power3.out). Visuals slide in 110px from their side, with 3° rotation, scale .94 and a 14px blur clearing (1.2s, expo.out). Pieces pop in with back.out(1.4). Counters run 0→N over 1.5s. There's a parallax scrub of yPercent 5→-7. Intensity "Restrained" multiplies distances by 0.55 (ship this).
- An Aurora WebGL background at 50% opacity, masked top and bottom. Decorative motif images drift (`pDrift`, 11–15s). A GradualBlur fixed to the page bottom.

### 4. Contact (`Contact.dc.html`)
- **Two-step booking form** inside a card: Step 1 "About you" (Name, Email, Phone optional, plus Business type, Budget and Timeline chips), then Step 2 "Pick a time" (next 10 weekdays, six slots per day, some unavailable), then the Booked confirmation.
- **Validation:** name required, email `/\S+@\S+\.\S+/`. Error copy: "Add your name and a valid email so we can send the invite." (`#B3402A`).
- **Inputs:** 48px tall, radius 12, border `#DCE7EF`. Focus state: border `#0C7CC4` plus a 4px ring at `rgba(12,124,196,.12)`.
- **Chips:** 38px pills. Selected chips are filled with the accent (1a ink `#0A1A25`, 1b azure `#0C7CC4`).
- **1a:** white with an Aurora wash, the host beside the form, three numbered steps and an email fallback.
- **1b:** ink background with azure glows, an 80px white headline with sky italic, and the host intro inside the card header.
- In production, wire Step 2 to a real scheduler (Cal.com or Calendly API) and the form to email or a CRM. The UI stays as designed.

### 5. Footer (`Footer.dc.html`)
- **1a light:** a four-column grid (brand plus "Websites, online ordering and back offices for *local* businesses.", then Site / Contact / Follow) and a bottom bar with ©, Privacy, Terms and a "Back to top ↑" pill.
- **1b dark:** the same content on ink, with an azure glow and an oversized 318px Hanken 800 "Meridian" wordmark with a gradient text fill, cropped at the bottom.

## Interactive components (`prototypes/*.jsx`)
These are React components and can be ported almost as-is into React islands:
- `Aurora.jsx`: WebGL noise ramp (uses `ogl`). Settings: colorStops `#FFFFFF,#9CCCEB,#0C7CC4`, amplitude 0.85–1.2, blend 0.55, speed 0.28–0.6, lightMode on. Always masked.
- `Motifs.jsx`: Strands and Prism (WebGL, `ogl`).
- `GlassSurface.jsx`: refracting nav bar (SVG displacement, Chromium only, falls back to blur 16 / saturate 1.7).
- `BorderGlow.jsx`: pointer-tracking edge glow card.
- `GradualBlur.jsx`: stacked backdrop blur at the page bottom.
- `BranchedMenu.jsx`: sidebar tree menu (docs and case-study chapters only).
- `Motion.jsx`: TextReveal, ShinyText, GlareHover, ScrollFloat, ScrollExpand, FadeContent. Exact timings are in the Design Kit §12.

Load WebGL components lazily (`client:visible` in Astro). Pause them when they're offscreen, and don't render them under reduced motion.

## Design tokens
All values are in **`tokens.css`**. Import it once and reference variables everywhere. Section-specific one-offs (Crochê palette, hero lime) live inside their sections.

## Assets
- `prototypes/uploads/pasted-1789947878169-0.png`: the mark, dark (crop to 58×22 via overflow; source is a square with padding). Export it as a trimmed SVG for production.
- `prototypes/uploads/pasted-1789947661700-0.png`: the mark, white.
- `prototypes/uploads/pasted-1789954960628-0.png`: the Hero background plate.
- `prototypes/uploads/pasted-17899500*.png`, `pasted-1790097*.png`: 3D motif renders (glass and gradient objects).
- `prototypes/assets/croche/*`: Crochê logos, product shots, notebook stickers and the coming-soon screenshot.
- Convert PNGs to AVIF/WebP at build time and set explicit width and height. Self-host the fonts (Instrument Sans, Newsreader, JetBrains Mono, Hanken Grotesk, plus Bodoni Moda, Archivo, DM Mono and Kalam for the case-study mocks) and subset them.

## Performance targets
- Lighthouse ≥ 95 on mobile. LCP is the Hero H1, so the hero plate must not block it.
- No layout shift from fonts (`size-adjust` fallbacks) or images.
- Ship GSAP and Lenis only on pages that use them.

## Files
- `prototypes/Hero.dc.html`, `Hero B.dc.html`, `Capabilities.dc.html`, `Process.dc.html`, `Contact.dc.html`, `Footer.dc.html`: section specs.
- `prototypes/Design Kit.dc.html`: foundations and component rules.
- `tokens.css`, `CLAUDE.md` (rules to paste into the repo), `CHANGELOG.md` (what changed per handoff).
