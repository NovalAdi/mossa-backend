import { Context } from "hono";
import { prisma } from "../prisma";
import { catchAsync, sendResponse } from "../utils";

export const list = catchAsync(async (c) => {
  const page = Math.max(1, parseInt(c.req.query("page") || "1"));
  const limit = Math.max(1, Math.min(parseInt(c.req.query("limit") || "10", 10), 100));
  const skip = (page - 1) * limit;

  const keys = c.req.query("key");
  let where: { bengkelId: string; key?: string } = { bengkelId: c.get("user")!.bengkelId };
  if (keys) where.key = keys;

  const [items, total] = await Promise.all([
    prisma.setting.findMany({ where, skip, take: limit, orderBy: { key: "asc" } }),
    prisma.setting.count({ where }),
  ]);

  return sendResponse(c, items, { page, limit, total });
});

export const getByKey = catchAsync(async (c) => {
  const key = c.req.param("key");
  const keyStr = key ?? "";
  const bengkelId = c.get("user")!.bengkelId;
  const item = await prisma.setting.findUnique({
    where: { key_bengkelId: { key: keyStr, bengkelId } },
  });
  if (!item) {
    return c.json({ success: false, error: "Setting tidak ditemukan." }, 404);
  }
  return sendResponse(c, item);
});

export const set = catchAsync(async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { key, value } = body as { key: string; value?: string };
  const item = await prisma.setting.upsert({
    where: { key_bengkelId: { key, bengkelId: c.get("user")!.bengkelId } },
    update: { value: value ?? null },
    create: { key, value: value || null, bengkelId: c.get("user")!.bengkelId },
  });
  return sendResponse(c, item);
});
