import { Context } from "hono";
import { prisma } from "../prisma";
import { catchAsync, sendResponse, serialize } from "../utils";

export const list = catchAsync(async (c) => {
  const page = Math.max(1, parseInt(c.req.query("page") || "1"));
  const limit = Math.max(1, Math.min(parseInt(c.req.query("limit") || "20", 10), 100));
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.booking.findMany({
      where: { bengkelId: c.get("user")!.bengkelId },
      skip, take: limit, orderBy: { createdAt: "desc" },
      include: { customer: true, vehicle: true, serviceType: true, staff: true },
    }),
    prisma.booking.count({ where: { bengkelId: c.get("user")!.bengkelId } }),
  ]);

  sendResponse(c, serialize(items), { page, limit, total });
});

export const get = catchAsync(async (c) => {
  const id = c.req.param("id");
  const item = await prisma.booking.findUnique({ where: { id } });
  if (!item) {
    return c.json({ success: false, error: "Booking tidak ditemukan." }, 404);
  }
  if (!item.bengkelId || item.bengkelId !== c.get("user")!.bengkelId) {
    return c.json({ success: false, error: "Booking nggak milik bengkel ini." }, 403);
  }
  return sendResponse(c, serialize(item));
});

export const create = catchAsync(async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { slot_date, slot_time, service_type_id, customer_id, vehicle_id } = body as {
    slot_date: string; slot_time: string; service_type_id: string;
    customer_id?: string; vehicle_id?: string;
  };

  const booking = await prisma.booking.create({
    data: {
      bengkelId: c.get("user")!.bengkelId,
      slotDate: new Date(slot_date),
      slotTime: slot_time || null,
      serviceTypeId: service_type_id,
      customerId: customer_id || undefined,
      vehicleId: vehicle_id || undefined,
      staffId: c.get("user")!.id,
      status: "booked" as const,
    },
  });
  return sendResponse(c, serialize(booking));
});

export const confirm = catchAsync(async (c) => {
  const booking = await prisma.booking.update({
    where: { id: c.req.param("id"), bengkelId: c.get("user")!.bengkelId },
    data: { status: "confirmed" as const, confirmedAt: new Date() },
  });
  return sendResponse(c, serialize(booking));
});

export const cancel = catchAsync(async (c) => {
  const booking = await prisma.booking.update({
    where: { id: c.req.param("id"), bengkelId: c.get("user")!.bengkelId },
    data: { status: "cancelled" as const, completedAt: new Date() },
  });
  return sendResponse(c, serialize(booking));
});

export const complete = catchAsync(async (c) => {
  const booking = await prisma.booking.update({
    where: { id: c.req.param("id"), bengkelId: c.get("user")!.bengkelId },
    data: { status: "completed" as const, completedAt: new Date() },
  });
  return sendResponse(c, serialize(booking));
});
