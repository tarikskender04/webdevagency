# Confirmed project decisions

- Brand: Meridian.
- Name: Tarik Skender.
- Sales & Outreach: Aladin Music.
- Other supplied employees: Ishak Sacirbey, Haris Susic, Kemal Mesic. Roles and biographies are not yet confirmed.
- Hero: B. Contact: 1a. Footer: 1b.
- The user explicitly chose a light Contact and dark Footer; preserve this pairing even though the exported README recommends matching options.
- Implementation: React + TypeScript on Astro, with static HTML for marketing pages.
- Market: businesses serving US and European customers. Content uses US English. No physical US office is claimed.
- Still needed for launch: contact email, production domain, verified business copy, and project evidence. Contact submission handling will be decided from the actual handoff.
- Handoff 1 imported from Web Design Kit System.zip (2026-10-13). The first homepage implementation includes Hero B's work deck, interactive capability previews, five process rows, Contact 1a, and Footer 1b.
- The user confirmed Crochê, Tierd, Una Adventure, and Captured are real clients/projects, and confirmed numerical results are not accurate or real. Removed "+38% leads", "Shipped since 2019", "thousands of orders", launch dates, and result counters. The process heading now ends in "opening day". Mock dashboard data is visibly labelled as sample data.
- Hero B's image slots are currently filled with supplied Crochê assets. The client strip lists all four confirmed clients. Add approved screenshots for the other projects when supplied; do not label Crochê images as other clients' work.
- No scheduler link is available. The contact form validates details, reviews the brief, and downloads it locally. It says no call is booked and no details are sent. PUBLIC_BOOKING_URL connects the second step to an external HTTPS scheduler; site.email adds an email-draft fallback. Backend enquiry delivery and an embedded live calendar are still pending.
- The contact host uses Tarik's initials until a real headshot is supplied. Unconfirmed social links and legal-page links are omitted rather than pointing to dead anchors.
- Performance/accessibility adaptations: responsive WebP assets; primary font preloads; visible-island hydration; immediate Hero H1 rendering; bounded WebGL drawing buffers; offscreen/hidden/reduced-motion animation pauses; deep-blue small labels for AA contrast; native scrolling with GSAP pinning on suitable desktops.
- The first pass uses the handoff's gradients as Hero Prism/Strands fallbacks. Exact refraction, pointer cursor choreography in the demos, the notebook pencil trace, and the fixed GradualBlur are not implemented. Preserve these as remaining visual refinements rather than marking them complete.
- Recommended general contact mailbox: hello@ on the actual owned Meridian domain. The domain and mailbox are not yet verified, so src/config/site.ts leaves email empty. The original hello@meridian.agency is an export placeholder, not a configured inbox.
