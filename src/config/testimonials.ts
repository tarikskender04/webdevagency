import type { ImageKey } from '../lib/assets';

/** Clients shown in the Stand out band. Logos are still placeholder glyphs until each client's logo file is supplied.
 *  Each card shows the client's portrait faded behind the quote and their first name as a signature.
 *  Quotes are written from each client's feedback as relayed by the studio; confirm the wording with the client before launch.
 *  Never invent a quote for a client; set placeholder to true for any card without their words. */
export type ClientGlyph = 'ring' | 'peak' | 'diamond' | 'arc';
export interface Testimonial { client: string; glyph: ClientGlyph; quote: string; name: string; role: string; photo?: ImageKey; placeholder: boolean; }

export const testimonials: Testimonial[] = [
  { client: 'Crochê', glyph: 'ring', quote: 'The care they put into our brand and website shows in every detail. By the end of the first month we were fully booked and had to turn down new orders. For a small business, that is more than I ever imagined.', name: 'Iman', role: 'Founder, Crochê', photo: 'imanPortrait', placeholder: false },
  { client: 'Una Adventure', glyph: 'peak', quote: 'Our website paid for itself almost straight away. In our first three months of operating, it brought in €20,000 in reservations on its own.', name: 'Irman', role: 'Owner, Una Adventure', photo: 'irmanPortrait', placeholder: false },
  { client: 'Captured', glyph: 'arc', quote: 'As a social media agency, the way we look is our pitch. The new site is bold and artistic, and clients now see us as the credible agency we are. Reaching them has never been easier.', name: 'Malik', role: 'Founder, Captured', photo: 'malikPortrait', placeholder: false },
];
