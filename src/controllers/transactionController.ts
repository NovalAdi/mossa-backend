import { Context } from "hono";
import { prisma } from "../prisma";
import { catchAsync, sendResponse, serialize } from "../utils";

export const list = catchAsync(async (c) => {
  const page = Math.max(1, parseInt(c.req.query("page") || "1"));
  const limit = Math.max(1, Math.min(parseInt(c.req.query("limit") || "10", 10), 100));
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where: { bengkelId: c.get("user")!.bengkelId },
      skip, take: limit, orderBy: { createdAt: "desc" },
      include: { customer: true, vehicle: true },
    }),
    prisma.transaction.count({ where: { bengkelId: c.get("user")!.bengkelId } }),
  ]);

  sendResponse(c, serialize(items), { page, limit, total });
});

export const get = catchAsync(async (c) => {
  const item = await prisma.transaction.findUnique({ where: { id: c.req.param("id") }, rejectOnNotFound: true });
  if (!item || item.bengkelId !== c.get("user")!.bengkelId) {
    return c.json({ success: false, error: "Transaction ini nggak milik bengkel ini." }, 403);
  }
  return sendResponse(c, item);
});

export const create = catchAsync(async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { amount, paymentMethod, referenceNo, customer_id, vehicle_id, serviceKey } = body as {
    amount?: number; paymentMethod: string; referenceNo?: string;
    customer_id?: string; vehicle_id?: string; serviceKey?: string;
  };
  const item = await prisma.transaction.create({
    data: {
      bengkelId: c.get("user")!.bengkelId,
      amount: amount ?? null,
      paymentMethod: paymentMethod as any,
      referenceNo: referenceNo || null,
      customerId: customer_id || null,
      vehicleId: vehicle_id || null,
      serviceKey: serviceKey || null,
    },
  });
  return sendResponse(c, item);
});
