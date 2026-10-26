/** The Worker bindings this site uses (wrangler.jsonc), read with `import { env } from 'cloudflare:workers'`.
 *  Declared by hand rather than generating the full runtime types with `wrangler types`. */
declare module 'cloudflare:workers' {
  interface AnalyticsEngineDataset { writeDataPoint(point: { blobs?: string[]; doubles?: number[]; indexes?: string[] }): void; }
  /** Optional: plain local dev may run without it. */
  export const env: { LUPO_DOWNLOADS?: AnalyticsEngineDataset };
}
