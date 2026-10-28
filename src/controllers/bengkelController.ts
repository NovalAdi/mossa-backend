import { Context } from "hono";
import { prisma } from "../prisma";
import { catchAsync, sendResponse, serialize } from "../utils";

// ---------- List (paginated) ----------
export const list = catchAsync(async (c) => {
  const page = Math.max(1, parseInt(c.req.query("page") || "1"));
  const limit = Math.max(1, Math.min(parseInt(c.req.query("limit") || "10", 10), 100));
  const skip = (page - 1) * limit;

  const orderBy: { name: "asc" | "desc" } = { name: "asc" };

  const [items, total] = await Promise.all([
    prisma.bengkel.findMany({ skip, take: limit, orderBy: orderBy }),
    prisma.bengkel.count(),
  ]);

  sendResponse(c, items, { page, limit, total });
});

// ---------- Get by id ----------
export const get = catchAsync(async (c) => {
  const id = c.req.param("id");
  const item = await prisma.bengkel.findUnique({ where: { id } });
  if (!item) {
    return c.json({ success: false, error: "Bengkel tidak ditemukan." }, 404);
  }
  return sendResponse(c, item);
});

// ---------- Create ----------
export const create = catchAsync(async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { name, description, address, latitude, longitude, phone, email, logoUrl, openingHours, photoUrl } = body as {
    name: string; description?: string; address?: string; latitude?: number; longitude?: number;
    phone?: string; email?: string; logoUrl?: string; openingHours?: any; photoUrl?: string;
  };
  const item = await prisma.bengkel.create({
    data: {
      name,
      description: description || null,
      address: address || null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      phone: phone || null,
      email: email || null,
      logoUrl: logoUrl || null,
      openingHours: openingHours || null,
      photoUrl: photoUrl || null,
    },
  });
  return sendResponse(c, item);
});

// ---------- Update ----------
export const update = catchAsync(async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const item = await prisma.bengkel.update({
    where: { id: c.req.param("id") },
    data: body,
  });
  return sendResponse(c, item);
});

// ---------- Remove ----------
export const remove = catchAsync(async (c) => {
  await prisma.bengkel.delete({
    where: { id: c.req.param("id") },
  });
  return c.json({ success: true, message: "Bengkel dihapus." });
});
