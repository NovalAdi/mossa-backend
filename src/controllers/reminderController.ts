import { Context } from "hono";
import { prisma } from "../prisma";
import { catchAsync, sendResponse, serialize } from "../utils";

export const list = catchAsync(async (c) => {
  const page = Math.max(1, parseInt(c.req.query("page") || "1"));
  const limit = Math.max(1, Math.min(parseInt(c.req.query("limit") || "10", 10), 100));
  const skip = (page - 1) * limit;

  const interval = Number(c.req.query("intervalDays")) || null;

  let where: { bengkelId: string; isActive: boolean; intervalDays?: number } = { bengkelId: c.get("user")!.bengkelId, isActive: true };
  if (interval) where.intervalDays = interval;

  const [items, total] = await Promise.all([
    prisma.reminder.findMany({ where, skip, take: limit, orderBy: { nextReminderAt: "asc" } }),
    prisma.reminder.count({ where }),
  ]);

  sendResponse(c, items, { page, limit, total });
});

export const get = catchAsync(async (c) => {
  const id = c.req.param("id");
  const item = await prisma.reminder.findUnique({ where: { id } });
  if (!item) {
    return c.json({ success: false, error: "Reminder tidak ditemukan." }, 404);
  }
  if (item.bengkelId !== c.get("user")!.bengkelId) {
    return c.json({ success: false, error: "Reminder ini nggak milik bengkel ini." }, 403);
  }
  return sendResponse(c, item);
});

export const create = catchAsync(async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { vehicle_id, service_type_id, intervalDays, nextReminderAt, isActive } = body as {
    vehicle_id?: string; service_type_id?: string; intervalDays?: number; nextReminderAt?: string; isActive?: boolean;
  };
  const reminder = await prisma.reminder.create({
    data: {
      bengkelId: c.get("user")!.bengkelId,
      vehicleId: vehicle_id || null,
      serviceTypeId: service_type_id || null,
      intervalDays: intervalDays ?? null,
      nextReminderAt: nextReminderAt ? new Date(nextReminderAt) : null,
      isActive: isActive ?? true,
    },
  });
  return sendResponse(c, reminder);
});

export const toggleActive = catchAsync(async (c) => {
  const existing = await prisma.reminder.findUnique({
    where: { id: c.req.param("id") },
  });
  if (!existing) {
    return c.json({ success: false, error: "Reminder tidak ditemukan." }, 404);
  }
  const item = await prisma.reminder.update({
    where: { id: c.req.param("id"), bengkelId: c.get("user")!.bengkelId },
    data: { isActive: !existing.isActive },
  });
  return sendResponse(c, item);
});

export const trigger = catchAsync(async (c) => {
  const item = await prisma.reminder.findUnique({ where: { id: c.req.param("id") }, rejectOnNotFound: true });
  if (!item) {
    return c.json({ success: false, error: "Reminder ini nggak ditemukan." }, 404);
  }
  if (item.bengkelId !== c.get("user")!.bengkelId) {
    return c.json({ success: false, error: "Reminder ini nggak milik bengkel ini." }, 403);
  }

  // Create a reminder log entry (channel & message can be supplied via query/body)
  const channel = c.req.query("channel") || "sms";
  const message = c.req.query("message") || `Ingat: servis ${item.serviceType?.name || "lengkap"} akan segera datang.`;

  const log = await prisma.reminderLog.create({
    data: {
      maintenanceReminderId: item.id,
      channel: channel as any,
      message,
      status: "sent" as const,
      sentAt: new Date(),
    },
  });

  return sendResponse(c, { reminder: item, log });
});
