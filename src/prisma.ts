import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import type { D1Database } from "@cloudflare/workers-types";

// Singleton Prisma client — used per isolate (Cloudflare Workers).
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export function initPrisma(db: D1Database) {
  // Lazy init: cek dulu apakah sudah dibuat global
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      adapter: new PrismaD1(db),
    });
  }
  return globalForPrisma.prisma;
}

export const prisma: PrismaClient = globalForPrisma.prisma
  ? globalForPrisma.prisma
  : initPrisma(getD1Database());

function getD1Database(): D1Database {
  return (globalThis as unknown as { env: { DB?: D1Database } }).env?.DB as D1Database;
}
