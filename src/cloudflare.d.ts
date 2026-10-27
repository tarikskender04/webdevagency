/** The Worker bindings this site uses (wrangler.jsonc), read with `import { env } from 'cloudflare:workers'`.
 *  Declared by hand rather than generating the full runtime types with `wrangler types`. */
declare module 'cloudflare:workers' {
  interface D1PreparedStatement { bind(...values: unknown[]): D1PreparedStatement; run(): Promise<unknown>; first<T>(): Promise<T | null>; }
  interface D1Database { prepare(sql: string): D1PreparedStatement; }
  /** Optional: plain local dev may run without it. */
  export const env: { DB?: D1Database };
  /** Keeps the Worker alive for the promise after the response has been sent. */
  export function waitUntil(promise: Promise<unknown>): void;
}
