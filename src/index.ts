import { app as honoApp } from "./hono";
import { initPrisma, prisma } from "./prisma";
import type { D1Database } from "@cloudflare/workers-types";

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  CORS_ORIGIN: string;
  RATE_LIMIT_WINDOW: string;
  RATE_LIMIT_MAX: string;
}

// Worker Cloudflare entrypoint.
// - Inisialisasi Prisma + D1 adapter (dari env.DB).
// - Hono app sudah siap dengan semua route yang di-mount.
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Inisialisasi Prisma sekali per isolate.
    initPrisma(env.DB);

    return honoApp.fetch(request, env, ctx);
  },
} as ExportedHandler<Env>;
