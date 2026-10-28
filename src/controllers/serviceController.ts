import { Context } from "hono";
import { prisma } from "../prisma";
import { catchAsync, sendResponse, serialize } from "../utils";

export const list = catchAsync(async (c) => {
  const page = Math.max(1, parseInt(c.req.query("page") || "1"));
  const limit = Math.max(1, Math.min(parseInt(c.req.query("limit") || "10", 10), 100));
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.serviceType.findMany({
      where: { bengkelId: c.get("user")!.bengkelId },
      skip, take: limit, orderBy: { name: "asc" },
    }),
    prisma.serviceType.count({ where: { bengkelId: c.get("user")!.bengkelId } }),
  ]);

  sendResponse(c, items, { page, limit, total });
});

export const get = catchAsync(async (c) => {
  const id = c.req.param("id");
  const item = await prisma.serviceType.findUnique({ where: { id } });
  if (!item) {
    return c.json({ success: false, error: "Service type tidak ditemukan." }, 404);
  }
  if (!item.bengkelId || item.bengkelId !== c.get("user")!.bengkelId) {
    return c.json({ success: false, error: "Service type ini nggak milik bengkel ini." }, 403);
  }
  return sendResponse(c, item);
});

export const create = catchAsync(async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { name, category, description, estimatedMinutes, price, icon, isActive } = body as {
    name: string; category: string; description?: string; estimatedMinutes?: number;
    price?: number; icon?: string; isActive?: boolean;
  };
  const item = await prisma.serviceType.create({
    data: {
      bengkelId: c.get("user")!.bengkelId,
      name: name,
      category: category as any,
      description: description || null,
      estimatedMinutes: estimatedMinutes ?? null,
      price: price ?? null,
      icon: icon || null,
      isActive: isActive ?? true,
    },
  });
  return sendResponse(c, item);
});

export const update = catchAsync(async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const item = await prisma.serviceType.update({
    where: { id: c.req.param("id"), bengkelId: c.get("user")!.bengkelId },
    data: body,
  });
  return sendResponse(c, item);
});

export const remove = catchAsync(async (c) => {
  await prisma.serviceType.delete({ where: { id: c.req.param("id"), bengkelId: c.get("user")!.bengkelId } });
  return c.json({ success: true, message: "Service type dihapus." });
});
