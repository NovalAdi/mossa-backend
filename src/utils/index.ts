import { Context } from "hono";
import type { PrismaClient } from "@prisma/client";

// ---------- Response builder ----------
export const sendResponse = <T>(
  c: Context,
  data: T,
  meta?: { page?: number; limit?: number; total?: number }
): void => {
  c.json({
    success: true,
    data,
    ...(meta && {
      meta: {
        page: meta.page ?? 1,
        limit: meta.limit ?? 20,
        total: meta.total ?? 0,
        totalPages: meta.total ? Math.ceil(meta.total / (meta.limit ?? 20)) : 0,
      },
    }),
  });
};

// ---------- Async wrapper: jalarkin error ke error-handling middleware (Hono) ----------
export const catchAsync =
  (fn: (c: Context) => Promise<Response | void>) =>
  async (c: Context): Promise<Response | void> => {
    try {
      await fn(c);
    } catch (err) {
      console.error("[controller error]:", err);
      c.status(500);
      c.json({ success: false, error: "Terjadi kesalahan server. Coba lagi nanti." });
    }
  };

// ---------- Serialization untuk Prisma Decimal dan Date -------------
export function serialize(value: unknown): unknown {
  // TODO: Ganti dengan proper Decimal handling setelah @prisma/client fix
  return value;
}
