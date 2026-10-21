import { defineConfig, envField, sessionDrivers } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { loadEnv } from 'vite';

const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), 'PUBLIC_');
const siteUrl = process.env.PUBLIC_SITE_URL || env.PUBLIC_SITE_URL;
const indexable = (process.env.PUBLIC_SITE_INDEXABLE || env.PUBLIC_SITE_INDEXABLE) === 'true';
if (siteUrl) {
  const url = new URL(siteUrl);
  if (url.protocol !== 'https:' || url.pathname !== '/' || url.search || url.hash || url.username || url.password) {
    throw new Error('PUBLIC_SITE_URL must be an HTTPS origin with no path, query, or credentials.');
  }
}
if (indexable && !siteUrl) throw new Error('An indexable build requires PUBLIC_SITE_URL.');

// Pages stay prerendered; only routes with `prerender = false` (the enquiry endpoint) run on Cloudflare Workers.
// Images are still optimized at build time with sharp, and nothing uses sessions, so no KV namespace is provisioned.
// The sitemap leaves out the 404 and the old /work/<slug>/ pages, which only redirect to their section of /work/.
export default defineConfig({
  site: siteUrl || undefined,
  output: 'static',
  adapter: cloudflare({ imageService: 'compile', prerenderEnvironment: 'node' }),
  session: { driver: sessionDrivers.memory() },
  env: {
    schema: {
      // Resend key with sending access only. Set as a Cloudflare secret (and in .dev.vars locally), never in the repo.
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
  trailingSlash: 'always',
  build: { inlineStylesheets: 'always' },
  // GSAP and OGL are only imported dynamically, so pre-bundle them at dev startup; otherwise Vite discovers them
  // mid-session, re-optimizes, and open tabs 404 on stale deps (and React's jsx-dev-runtime ends up mismatched).
  vite: { optimizeDeps: { include: ['gsap', 'gsap/ScrollTrigger', 'ogl'] } },
  integrations: [react(),...(indexable ? [sitemap({ filter: (page) => !/^\/(404|work\/[^/]+)\/?$/.test(new URL(page).pathname) })] : [])],
});
