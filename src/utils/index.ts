import { Context } from "hono";
import { Decimal } from "@prisma/client";

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
  if (value instanceof Decimal) return Number(value);
  if (Array.isArray(value)) return value.map(serialize);
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = serialize(v);
    }
    return out;
  }
  return value;
}
