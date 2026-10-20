import type { IconName } from '../lib/icons';

/** Client cards and the /work/ page sections, in carousel order. Copy describes the supplied work;
 *  service scope is only included where confirmed. No results, dates or live-site URLs are assumed.
 *  `href` points at the project's section on /work/; the old /work/<slug>/ URLs redirect there. */
export type WorkId = 'croche' | 'una' | 'tierd' | 'captured';
export interface WorkDetail { title: string; body: string; }
/** Supplied 3:4 project sheets in src/assets/work/references/. */
export type SheetImage = 'croche-design-system' | 'tierd-brand-system' | 'tierd-homepage';
/** Supplied desktop screenshots (2986 × 1734) in src/assets/work/gallery/. */
export type ShotImage = 'croche-collections' | 'croche-packaging' | 'una-home' | 'una-routes' | 'captured-clients' | 'captured-team' | 'tierd-explore' | 'una-dashboard';
/** One tile of a project's gallery. Sheets, screenshots and the reel open full size; `art` is the project's showcase card
 *  and `details` its three detail notes. A reel is a silent screen recording in public/video/ that loops while in view. */
export type WorkTile =
  | { type: 'art' }
  | { type: 'details' }
  | { type: 'sheet'; image: SheetImage; caption: string; alt: string }
  | { type: 'shot'; image: ShotImage; caption: string; alt: string }
  | { type: 'reel'; src: string; poster: 'captured-reel-poster' | 'croche-reel-poster'; caption: string; label: string };
/** Gallery rows. Pairing a 3:4 tile (art, sheet or details) with a wide one (shot or reel) sizes them 1 : 2.3, so both
 *  come out the same height; two wide tiles or three 3:4 tiles share a row equally; two 3:4 tiles with `details` give the
 *  details a double column; `details` alone runs three across. */
export type WorkRow = WorkTile[];
/** Colours sampled from a project's supplied artwork, shown as swatches under its summary. */
export interface WorkSwatch { label: string; value: string; }
export interface Work {
  id: WorkId;
  slug: string;
  client: string;
  tag: string;
  description: string;
  href: string;
  linkLabel: string;
  headline: string;
  summary: string;
  details: WorkDetail[];
  gallery: WorkRow[];
  palette?: WorkSwatch[];
  /** The /work/ background aurora while this project is in view: colours taken from its supplied artwork. */
  aurora: readonly string[];
  /** The same at night, where `aurora` has a pale middle stop that would glow as a white haze on ink: the project's
   *  accent alone. Without it, night uses `aurora`. */
  auroraNight?: readonly string[];
}

/** The /work/ background aurora above the first project: the studio's own sky-to-azure ramp by day, and at night the
 *  deep-to-azure glow of the dark Contact and Footer. Each project's `aurora` replaces it while that project is in view. */
export const workAurora: readonly string[] = ['#9CCCEB', '#0C7CC4', '#9CCCEB'];
export const workAuroraNight: readonly string[] = ['#084B7A', '#0C7CC4', '#084B7A'];

export const work: Work[] = [
  {
    id: 'croche', slug: 'croche', client: 'Crochê', tag: 'Crochê · brand + site',
    aurora: ['#7B1E3A', '#7B1E3A', '#7B1E3A'],
    description: 'Crochê: the view from inside a red hand-crocheted bag',
    href: '/work/#croche', linkLabel: 'View the Crochê project',
    headline: 'A handmade brand, taken digital.',
    summary: 'Crochê makes hand-crocheted bags in Sarajevo. The project brings its identity, collection and ordering experience together, with a back office built around the maker’s day.',
    details: [
      { title: 'A look that carries through', body: 'A wine accent, Bodoni for the names and monospaced prices give the collection a consistent voice, from the shop to the customer emails and printed tags.' },
      { title: 'An order that feels personal', body: 'Customers choose a model, a size and up to three yarn colours. The bag preview changes with their choices, while the price stays in view.' },
      { title: 'Tools for the person making it', body: 'The owner panel brings the catalogue and orders together. Stock and model availability can be updated without waiting on a developer.' },
    ],
    gallery: [
      [
        { type: 'sheet', image: 'croche-design-system', caption: 'Design system', alt: 'The Crochê design system sheet: Bodoni Moda, Archivo and JetBrains Mono on a type scale, Order and Sizes buttons with an In progress tag, and the five-colour palette from Kost to Vino.' },
        { type: 'reel', src: '/video/croche-reel.mp4', poster: 'croche-reel-poster', caption: 'Site walkthrough', label: 'A screen recording of the Crochê website: the “Ručno radeno” hero, the red bag turning on a seaside table through “Red po red” and “Bez mašine”, then the featured pieces with their prices.' },
      ],
      [
        { type: 'shot', image: 'croche-collections', caption: 'Collections', alt: 'The Crochê collections page, “Gotove serije”: Wild, Metallic and IQOS Wrap cards with photos, models, prices and yarn colour chips.' },
        { type: 'shot', image: 'croche-packaging', caption: 'Packaging and footer', alt: 'The Crochê packaging section, “Stiže kao poklon. I kad nije poklon.”, with the thank-you card on a wine-striped ground, the list of printed pieces, and the dark footer.' },
      ],
      [{ type: 'details' }],
    ],
  },
  {
    id: 'una', slug: 'una-adventure', client: 'Una Adventure', tag: 'Una Adventure · site + dashboard',
    aurora: ['#1F4D38', '#6FC5C9', '#1F4D38'],
    description: 'Una Adventure: rafting on the Una River in Bihać',
    href: '/work/#una-adventure', linkLabel: 'View the Una Adventure project',
    headline: 'The river sets the direction.',
    summary: 'A website and owner dashboard for Una Adventure, a rafting business on the Una River in Bihać, Bosnia and Herzegovina. The visual direction takes its cues from the water and the outdoors.',
    details: [
      { title: 'A sense of the place', body: 'Forest green, aqua and an orange accent bring the landscape into the design. The line “Feel the power of the Una” puts the river at the centre.' },
      { title: 'Two ways onto the water', body: 'The showcase introduces the Adrenaline and Paradise routes with distinct colours, giving each experience its own place in the visual system.' },
      { title: 'Website + owner dashboard', body: 'The project pairs the customer-facing website with an owner dashboard, bringing the visitor experience and the business side into the same project.' },
    ],
    gallery: [
      [
        { type: 'art' },
        { type: 'shot', image: 'una-home', caption: 'Homepage', alt: 'The Una Adventure homepage: “Feel the power of the Una” over the Štrbački Buk waterfalls, with Book your date and See the routes buttons, a 5.0 Google rating, 23 guest reviews and prices from €35.' },
      ],
      [
        { type: 'shot', image: 'una-routes', caption: 'Routes', alt: 'The Una Adventure routes section, “Choose your rhythm”: Štrbački Buk at 50€ and Kostela at 35€ per person, side by side, above guest photos from the river.' },
        { type: 'shot', image: 'una-dashboard', caption: 'Owner dashboard', alt: 'The Una Adventure owner dashboard calendar for October 2026: each day shows its number of guests with a bar split between the two routes, beside a Today panel with an Add to this day button and a New reservation button in the sidebar.' },
      ],
      [{ type: 'details' }],
    ],
  },
  {
    id: 'tierd', slug: 'tierd', client: 'Tierd', tag: 'Tierd',
    aurora: ['#FF5A1F', '#F1EBDF', '#FF5A1F'],
    auroraNight: ['#FF5A1F', '#FF5A1F', '#FF5A1F'],
    description: 'Tierd: the ranked dev platform',
    href: '/work/#tierd', linkLabel: 'View the Tierd project',
    headline: 'A small mark with a clear point.',
    summary: 'Tierd is a ranked dev platform. Its showcase uses a compact “t.” mark, warm neutrals and a sharp orange accent to give the name a distinctive presence.',
    details: [
      { title: 'The mark', body: 'The lowercase “t.” is the focal point. Its orange full stop carries the accent into a compact form that also works in the corner badge.' },
      { title: 'The palette', body: 'Warm, light lettering sits against a dark brown background. Orange is reserved for the dots, keeping the emphasis precise.' },
      { title: 'The composition', body: 'The mark, the Tierd name and “The ranked dev platform” form a simple vertical stack, with space around each element.' },
    ],
    palette: [
      { label: 'Ground', value: '#15110D' },
      { label: 'Lettering', value: '#F1EBDF' },
      { label: 'Dot', value: '#FF5A1F' },
    ],
    gallery: [
      [
        { type: 'shot', image: 'tierd-explore', caption: 'Explore', alt: 'The Tierd explore page: a large “explore.” headline and builder search, a signed-in profile card with following, followers and score, new builders to follow, a “what did you ship today?” composer, recent activity and trending projects.' },
        { type: 'art' },
      ],
      [
        { type: 'sheet', image: 'tierd-brand-system', caption: 'Brand system', alt: 'The Tierd brand system sheet: the primary “t.” mark, code, tiers and stamp variants, Boldonse, Bricolage Grotesque and JetBrains Mono type, and an orange-led palette on a dark ground.' },
        { type: 'sheet', image: 'tierd-homepage', caption: 'Homepage', alt: 'The Tierd homepage: the headline “the social for developers.” above a sample feed post with a short code snippet.' },
        { type: 'details' },
      ],
    ],
  },
  {
    id: 'captured', slug: 'captured', client: 'Captured', tag: 'Captured',
    aurora: ['#FF2D8A', '#BFD9F0', '#FF2D8A'],
    auroraNight: ['#FF2D8A', '#FF2D8A', '#FF2D8A'],
    description: 'Captured: a goldfish bowl on a sunny beach',
    href: '/work/#captured', linkLabel: 'View the Captured project',
    headline: 'An unexpected point of view.',
    summary: 'Captured is a creative agency in Vaasa, Finland. Its showcase brings a sunny beach, a fishbowl and a bold wordmark into one playful composition.',
    details: [
      { title: 'A scene to remember', body: 'The fishbowl is the focal point of an otherwise familiar beach scene. That unexpected detail gives the composition its character.' },
      { title: 'A name in the frame', body: 'Viewfinder corners frame the Captured wordmark. The bowl sits in front of the lettering, adding depth to the image.' },
      { title: 'A small signature', body: 'A pink corner and matching dot add a restrained accent. The caption anchors the scene with the agency’s name, field and location.' },
    ],
    gallery: [
      [
        { type: 'art' },
        { type: 'reel', src: '/video/captured-reel.mp4', poster: 'captured-reel-poster', caption: 'Site walkthrough', label: 'A screen recording of the Captured website: the hero switching between day and night, the client logos, the four-step process, the team and the contact section.' },
      ],
      [
        { type: 'shot', image: 'captured-clients', caption: 'Clients', alt: 'The Captured site at night: a strip of client logos above the line “Hey. Your feed is a fishbowl. We’re the whole ocean.”, with a short introduction and a See the work button.' },
        { type: 'shot', image: 'captured-team', caption: 'Team', alt: 'The Captured team section by day: “Our people” beside pinned black-and-white polaroids of Malik Fajic, founder and creative director, Alexandra Stark, sales executive, and Joni Keko, graphic designer.' },
      ],
      [{ type: 'details' }],
    ],
  },
];

/** The Crochê walkthrough at the top of /work/: the "Behind the build" section, ahead of the work reference. Until `src` is set the page shows a "coming soon" poster.
 *  The file lives in public/video/ (H.264 MP4, faststart); its posters are src/assets/work/croche-walkthrough-poster(-phone).png.
 *  Captions are WebVTT, next to the video. Chapters are the planned outline.
 *  `heading` and `headline` are the section's title lines; each chapter carries a kit icon.
 *  `published` (the day the video went live on /work/) and `length` (ISO 8601, from the file: 2:12) feed the page's
 *  VideoObject structured data. */
export interface WalkthroughChapter { title: string; icon: IconName; }
export interface Walkthrough { src?: string; captions?: string; duration?: string; published?: string; length?: string; heading?: string; headline?: string; chapters: WalkthroughChapter[]; }
export const crocheWalkthrough: Walkthrough = {
  src: '/video/croche-walkthrough.mp4',
  captions: '/video/croche-walkthrough.en.vtt',
  duration: '2 min',
  published: '2026-10-20',
  length: 'PT2M12S',
  heading: 'Behind the build:',
  headline: 'Our founder, Tarik Skender, on how we built it, and why.',
  chapters: [
    { title: 'Why Crochê needed more than a shop page', icon: 'target' },
    { title: 'Ordering: model, size and colour, priced as you go', icon: 'swatch' },
    { title: 'The owner panel behind every order', icon: 'chart' },
    { title: 'How the same setup could work for your business', icon: 'spark' },
  ],
};

/** The Crochê collection on /work/: two series cards and the Sun & Salt banner, from src/assets/work/collection/. */
export interface CollectionPiece { image: 'sun-salt-card' | 'afterglow-card' | 'sun-salt-banner'; caption: string; alt: string; }
export const crocheCollection: { cards: CollectionPiece[]; banner: CollectionPiece } = {
  cards: [
    { image: 'sun-salt-card', caption: 'Sun & Salt', alt: 'The Sun & Salt series card, Serija 01, June and July, open for orders: a cobalt bag hung with shell and glass charms beside a terracotta bag on a striped beach towel with lemons, the line “Torba koja se vraća s plaže puna pijeska i ne izvinjava se.”, five yarn swatches from Kobalt to So, and four models.' },
    { image: 'afterglow-card', caption: 'Afterglow', alt: 'The Afterglow series card, Serija 02, September, coming soon: a dark crocheted bag with a gold chain against an orange wall in late light, the line “Zadnjih dvadeset minuta svjetla, kad zid postane narandžast.”, five yarn swatches from Espresso to Sumrak, and four models.' },
  ],
  banner: { image: 'sun-salt-banner', caption: 'Sun & Salt banner', alt: 'The Sun & Salt collection banner, Kolekcija 01, orders until 21 July: the beach photo of the cobalt and terracotta bags beside the series name, a short note on how each piece is made to order, and five colour dots.' },
};

/** What the Crochê build means for other businesses: one feature, then the same idea in a client's terms. */
export interface WorkFit { title: string; icon: IconName; built: string; yours: string; }
export const crocheFit: WorkFit[] = [
  { title: 'Orders that fit the product', icon: 'layers', built: 'Customers choose a model, a size and up to three yarn colours, and see the price as they go.', yours: 'The same flow can take a cake order by size and flavour, a bouquet by colour and stems, or a service with its add-ons.' },
  { title: 'You stay in charge', icon: 'chart', built: 'The owner updates stock and model availability directly, without waiting on a developer.', yours: 'Change a menu, a price list or your opening hours yourself, the same day.' },
  { title: 'One look, everywhere', icon: 'swatch', built: 'The same type and colours carry from the shop to the customer emails and printed tags.', yours: 'Your site, your confirmations and your printed pieces read as one business.' },
];
