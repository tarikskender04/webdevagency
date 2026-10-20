import type { APIRoute } from 'astro';
import { RESEND_API_KEY } from 'astro:env/server';
import { site } from '../../config/site';
import { briefText, parseBrief } from '../../lib/enquiry';

export const prerender = false;

const minimumFillTime = 3000;
const maximumBodySize = 4096;
const idPattern = /^[0-9a-f-]{36}$/;

function reply(status: number, error?: string): Response {
  return Response.json(error ? { error } : { ok: true }, { status, headers: { 'cache-control': 'no-store' } });
}

/** Delivers a project brief to the studio inbox through Resend. The visitor's address is the Reply-To. */
export const POST: APIRoute = async ({ request, url }) => {
  const origin = request.headers.get('origin');
  if (origin && origin !== url.origin) return reply(403, 'forbidden');
  if (!request.headers.get('content-type')?.startsWith('application/json')) return reply(415, 'unsupported');
  const raw = await request.text();
  if (raw.length > maximumBodySize) return reply(413, 'too-large');
  let body: Record<string, unknown>;
  try { body = JSON.parse(raw); } catch { return reply(400, 'invalid'); }
  // Bots fill the hidden field or submit instantly. Answer as if it worked so they learn nothing.
  if (body.website || typeof body.elapsed !== 'number' || body.elapsed < minimumFillTime) return reply(200);
  const brief = parseBrief(body);
  if (!brief) return reply(400, 'invalid');
  if (!RESEND_API_KEY) return reply(503, 'unavailable');
  const id = typeof body.id === 'string' && idPattern.test(body.id) ? body.id : crypto.randomUUID();
  const sent = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${RESEND_API_KEY}`, 'content-type': 'application/json', 'idempotency-key': `enquiry-${id}` },
    body: JSON.stringify({
      from: site.enquiry.from,
      to: [site.email],
      reply_to: brief.email,
      subject: `New project brief: ${brief.name}${brief.business ? ` · ${brief.business}` : ''}`,
      text: `${briefText(brief)}\nReply to this email to answer ${brief.name} directly.\n`,
    }),
  }).catch(() => null);
  if (!sent?.ok) {
    console.error('Enquiry delivery failed', sent?.status ?? 'network error');
    return reply(502, 'delivery');
  }
  return reply(200);
};

export const ALL: APIRoute = () => new Response(null, { status: 405, headers: { allow: 'POST' } });
