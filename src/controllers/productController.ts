import { Context } from "hono";
import { prisma } from "../prisma";
import { catchAsync, sendResponse, serialize } from "../utils";

export const list = catchAsync(async (c) => {
  const page = Math.max(1, parseInt(c.req.query("page") || "1"));
  const limit = Math.max(1, Math.min(parseInt(c.req.query("limit") || "10", 10), 100));
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where: { bengkelId: c.get("user")!.bengkelId },
      skip, take: limit, orderBy: { name: "asc" },
    }),
    prisma.product.count({ where: { bengkelId: c.get("user")!.bengkelId } }),
  ]);

  sendResponse(c, items, { page, limit, total });
});

export const get = catchAsync(async (c) => {
  const id = c.req.param("id");
  const item = await prisma.product.findUnique({ where: { id } });
  if (!item) {
    return c.json({ success: false, error: "Product tidak ditemukan." }, 404);
  }
  if (!item.bengkelId || item.bengkelId !== c.get("user")!.bengkelId) {
    return c.json({ success: false, error: "Product ini nggak milik bengkel ini." }, 403);
  }
  return sendResponse(c, item);
});

export const create = catchAsync(async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { name, category, sku, barcode, unitPrice, stock, minStock, photoUrl } = body as {
    name: string; category?: string; sku?: string; barcode?: string;
    unitPrice?: number; stock?: number; minStock?: number; photoUrl?: string;
  };
  const item = await prisma.product.create({
    data: {
      bengkelId: c.get("user")!.bengkelId,
      name: name,
      category: category || null,
      sku: sku || null,
      barcode: barcode || null,
      unitPrice: unitPrice ?? null,
      stock: stock ?? 0,
      minStock: minStock ?? 0,
      photoUrl: photoUrl || null,
    },
  });
  return sendResponse(c, item);
});

export const update = catchAsync(async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const item = await prisma.product.update({
    where: { id: c.req.param("id"), bengkelId: c.get("user")!.bengkelId },
    data: body,
  });
  return sendResponse(c, item);
});

export const remove = catchAsync(async (c) => {
  await prisma.product.delete({ where: { id: c.req.param("id"), bengkelId: c.get("user")!.bengkelId } });
  return c.json({ success: true, message: "Product dihapus." });
});

export const adjustStock = catchAsync(async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { quantity, reason } = body as { quantity: number; reason?: string };

  const item = await prisma.product.update({
    where: { id: c.req.param("id"), bengkelId: c.get("user")!.bengkelId },
    data: {
      stock: { increment: quantity },
      inventoryLogs: {
        create: { type: quantity >= 0 ? "in" : "out", quantity: Math.abs(quantity), reason: reason || null },
      },
    },
  });
  return sendResponse(c, item);
});
