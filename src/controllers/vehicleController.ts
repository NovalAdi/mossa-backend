import { Context } from "hono";
import { prisma } from "../prisma";
import { catchAsync, sendResponse } from "../utils";

export const list = catchAsync(async (c) => {
  const page = Math.max(1, parseInt(c.req.query("page") || "1"));
  const limit = Math.max(1, Math.min(parseInt(c.req.query("limit") || "10", 10), 100));
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.vehicle.findMany({
      where: { bengkelId: c.get("user")!.bengkelId },
      skip, take: limit, orderBy: { createdAt: "desc" },
    }),
    prisma.vehicle.count({ where: { bengkelId: c.get("user")!.bengkelId } }),
  ]);

  sendResponse(c, items, { page, limit, total });
});

export const get = catchAsync(async (c) => {
  const id = c.req.param("id");
  const item = await prisma.vehicle.findUnique({ where: { id } });
  if (!item) {
    return c.json({ success: false, error: "Vehicle tidak ditemukan." }, 404);
  }
  if (item.bengkelId !== c.get("user")!.bengkelId) {
    return c.json({ success: false, error: "Vehicle ini nggak milik bengkel ini." }, 403);
  }
  return sendResponse(c, item);
});

export const create = catchAsync(async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { customer_id, plate, brand, model, year, color, engineType, vin } = body as {
    customer_id?: string; plate?: string; brand?: string; model?: string; year?: number;
    color?: string; engineType?: string; vin?: string;
  };
  const vehicle = await prisma.vehicle.create({
    data: {
      bengkelId: c.get("user")!.bengkelId,
      customerId: customer_id || null,
      plate: plate || null,
      brand: brand || null,
      model: model || null,
      year: year || null,
      color: color || null,
      engineType: engineType || null,
      vin: vin || null,
    },
  });
  return sendResponse(c, vehicle);
});

export const update = catchAsync(async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const vehicle = await prisma.vehicle.update({
    where: { id: c.req.param("id"), bengkelId: c.get("user")!.bengkelId },
    data: body,
  });
  return sendResponse(c, vehicle);
});

export const remove = catchAsync(async (c) => {
  await prisma.vehicle.delete({ where: { id: c.req.param("id"), bengkelId: c.get("user")!.bengkelId } });
  return c.json({ success: true, message: "Vehicle dihapus." });
});
