import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import type { D1Database } from "@cloudflare/workers-types";

// Singleton Prisma client — used per isolate (Cloudflare Workers).
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter: new PrismaD1((globalThis as unknown as { env: { DB?: D1Database } }).env?.DB as D1Database),
  });
