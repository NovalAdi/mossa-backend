import { Context } from "hono";
import { prisma } from "../prisma";
import { catchAsync, sendResponse, serialize } from "../utils";

export const list = catchAsync(async (c) => {
  const page = Math.max(1, parseInt(c.req.query("page") || "1"));
  const limit = Math.max(1, Math.min(parseInt(c.req.query("limit") || "10", 10), 100));
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.queueEntry.findMany({
      where: { bengkelId: c.get("user")!.bengkelId },
      skip, take: limit, orderBy: { createdAt: "desc" },
      include: { vehicle: true, customer: true, serviceType: true, staff: true },
    }),
    prisma.queueEntry.count({ where: { bengkelId: c.get("user")!.bengkelId } }),
  ]);

  sendResponse(c, items, { page, limit, total });
});

export const getRealtime = catchAsync(async (c) => {
  const queue = await prisma.queueEntry.findMany({
    where: { bengkelId: c.get("user")!.bengkelId, status: { in: ["waiting", "in_progress"] } },
    orderBy: { queuePosition: "asc" },
    include: { vehicle: true, customer: true, serviceType: true, staff: true },
  });

  // Estimate wait time based on queue position + service duration
  const withEstimate = queue.map((entry, i) => {
    const est = entry.estimatedWaitMinutes || 0;
    const item = {
      ...serialize(entry),
      estimatedWaitMinutes: est,
      position: i + 1,
      estimatedWaitText: i === 0 ? `${est} menit` : `${est * i} menit`,
    };
    return item;
  });

  return sendResponse(c, withEstimate, { page: 1, limit: 20, total: queue.length });
});

export const create = catchAsync(async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { vehicle_id, customer_id, service_type_id, note } = body as {
    vehicle_id?: string; customer_id?: string; service_type_id?: string; note?: string;
  };
  const queueEntry = await prisma.queueEntry.create({
    data: {
      bengkelId: c.get("user")!.bengkelId,
      vehicleId: vehicle_id || null,
      customerId: customer_id || null,
      serviceTypeId: service_type_id || null,
      status: "waiting" as const,
      note: note || null,
    },
  });
  return sendResponse(c, serialize(queueEntry));
});

export const updateStatus = catchAsync(async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { status } = body as { status: string };
  const queueEntry = await prisma.queueEntry.update({
    where: { id: c.req.param("id"), bengkelId: c.get("user")!.bengkelId },
    data: { status: status as any, startedAt: status === "in_progress" ? new Date() : undefined },
  });
  return sendResponse(c, serialize(queueEntry));
});
