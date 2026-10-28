import { Context } from "hono";
import { prisma } from "../prisma";
import { catchAsync, sendResponse, serialize } from "../utils";

export const list = catchAsync(async (c) => {
  const page = Math.max(1, parseInt(c.req.query("page") || "1"));
  const limit = Math.max(1, Math.min(parseInt(c.req.query("limit") || "10", 10), 100));
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.customer.findMany({
      where: { bengkelId: c.get("user")!.bengkelId },
      skip, take: limit, orderBy: { name: "asc" },
    }),
    prisma.customer.count({ where: { bengkelId: c.get("user")!.bengkelId } }),
  ]);

  sendResponse(c, items, { page, limit, total });
});

export const get = catchAsync(async (c) => {
  const id = c.req.param("id");
  const item = await prisma.customer.findUnique({ where: { id } });
  if (!item) {
    return c.json({ success: false, error: "Customer tidak ditemukan." }, 404);
  }
  if (!item.bengkelId || item.bengkelId !== c.get("user")!.bengkelId) {
    return c.json({ success: false, error: "Customer ini nggak milik bengkel ini." }, 403);
  }
  return sendResponse(c, item);
});

export const create = catchAsync(async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { name, ...data } = body as Record<string, unknown>;
  const item = await prisma.customer.create({
    data: { name: String(name), bengkelId: c.get("user")!.bengkelId, ...data },
  });
  return sendResponse(c, item);
});

export const update = catchAsync(async (c) => {
  const item = await prisma.customer.update({
    where: { id: c.req.param("id"), bengkelId: c.get("user")!.bengkelId },
    data: await c.req.json().catch(() => ({})),
  });
  return sendResponse(c, item);
});

export const remove = catchAsync(async (c) => {
  await prisma.customer.delete({ where: { id: c.req.param("id"), bengkelId: c.get("user")!.bengkelId } });
  return c.json({ success: true, message: "Customer dihapus." });
});
