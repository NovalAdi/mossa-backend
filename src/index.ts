import { app as honoApp } from "./hono";
import { initPrisma, prisma } from "./prisma";
import type { D1Database } from "@cloudflare/workers-types";

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  CORS_ORIGIN: string;
  RATE_LIMIT_WINDOW: string;
  RATE_LIMIT_MAX: string;
}

// Worker Cloudflare entrypoint.
// - Inisialisasi Prisma + D1 adapter (dari env.DB).
// - Config env (JWT_SECRET, JWT_EXPIRES_IN) di-global untuk auth.ts.
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Set env vars ke global agar auth.ts bisa baca
    globalThis.JWT_SECRET = env.JWT_SECRET;
    globalThis.JWT_EXPIRES_IN = env.JWT_EXPIRES_IN;

    // Inisialisasi Prisma sekali per isolate.
    initPrisma(env.DB);

    return honoApp.fetch(request, env, ctx);
  },
} as ExportedHandler<Env>;
