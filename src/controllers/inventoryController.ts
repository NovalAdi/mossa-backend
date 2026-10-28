import { Context } from "hono";
import { prisma } from "../prisma";
import { catchAsync, sendResponse, serialize } from "../utils";

export const list = catchAsync(async (c) => {
  const page = Math.max(1, parseInt(c.req.query("page") || "1"));
  const limit = Math.max(1, Math.min(parseInt(c.req.query("limit") || "10", 10), 100));
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.inventoryLog.findMany({
      where: { productId: { in: [] } }, // will filter below properly
      skip, take: limit, orderBy: { createdAt: "desc" },
      include: { product: { select: { name: true, sku: true, barcode: true } } },
    }),
    prisma.product.count({ where: { bengkelId: c.get("user")!.bengkelId } }),
  ]);

  // The query above was a placeholder; do a proper per-product listing with logs
  const productIdList = await prisma.product.findMany({
    where: { bengkelId: c.get("user")!.bengkelId },
    select: { id: true },
    skip, take: limit, orderBy: { name: "asc" },
  });

  const logs: any[] = [];
  for (const p of productIdList) {
    const logsForProduct = await prisma.inventoryLog.findMany({
      where: { productId: p.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    logs.push({ product: p, logs: logsForProduct });
  }

  sendResponse(c, logs, { page, limit, total: productIdList.length });
});

export const get = catchAsync(async (c) => {
  const item = await prisma.inventoryLog.findUnique({ where: { id: c.req.param("id") }, rejectOnNotFound: true });
  if (!item || item.productId) {
    // Product relation not loaded; verify via product lookup
    const product = await prisma.product.findUnique({ where: { id: item?.productId || "" } });
    if (!product || product.bengkelId !== c.get("user")!.bengkelId) {
      return c.json({ success: false, error: "Inventory log ini nggak milik bengkel ini." }, 403);
    }
  }
  return sendResponse(c, serialize(item));
});

export const create = catchAsync(async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { product_id, type, quantity, reason, referenceId } = body as {
    product_id: string; type: string; quantity: number; reason?: string; referenceId?: string;
  };

  // Verify product belongs to bengkel
  const product = await prisma.product.findUnique({ where: { id: product_id, bengkelId: c.get("user")!.bengkelId } });
  if (!product) {
    return c.json({ success: false, error: "Product tidak ditemukan." }, 404);
  }

  const item = await prisma.inventoryLog.create({
    data: {
      bengkelId: c.get("user")!.bengkelId,
      productId: product_id,
      type: type as any,
      quantity,
      reason: reason || null,
      referenceId: referenceId || null,
    },
  });
  return sendResponse(c, serialize(item));
});
