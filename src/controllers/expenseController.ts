import { Context } from "hono";
import { prisma } from "../prisma";
import { catchAsync, sendResponse, serialize } from "../utils";

export const list = catchAsync(async (c) => {
  const page = Math.max(1, parseInt(c.req.query("page") || "1"));
  const limit = Math.max(1, Math.min(parseInt(c.req.query("limit") || "10", 10), 100));
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.expense.findMany({
      where: { bengkelId: c.get("user")!.bengkelId },
      skip, take: limit, orderBy: { date: "desc" },
    }),
    prisma.expense.count({ where: { bengkelId: c.get("user")!.bengkelId } }),
  ]);

  sendResponse(c, serialize(items), { page, limit, total });
});

export const get = catchAsync(async (c) => {
  const id = c.req.param("id");
  const item = await prisma.expense.findUnique({ where: { id } });
  if (!item) {
    return c.json({ success: false, error: "Expense tidak ditemukan." }, 404);
  }
  if (!item.bengkelId || item.bengkelId !== c.get("user")!.bengkelId) {
    return c.json({ success: false, error: "Expense ini nggak milik bengkel ini." }, 403);
  }
  return sendResponse(c, serialize(item));
});

export const create = catchAsync(async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { name, category, amount, paymentMethod, date, note } = body as {
    name: string; category?: string; amount?: number; paymentMethod: string; date: string; note?: string;
  };
  const item = await prisma.expense.create({
    data: {
      bengkelId: c.get("user")!.bengkelId,
      name: name,
      category: category as any,
      amount: amount ?? null,
      paymentMethod: paymentMethod as any,
      date: new Date(date),
      note: note || null,
    },
  });
  return sendResponse(c, serialize(item));
});

export const update = catchAsync(async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const item = await prisma.expense.update({
    where: { id: c.req.param("id"), bengkelId: c.get("user")!.bengkelId },
    data: body,
  });
  return sendResponse(c, serialize(item));
});

export const remove = catchAsync(async (c) => {
  await prisma.expense.delete({ where: { id: c.req.param("id"), bengkelId: c.get("user")!.bengkelId } });
  return c.json({ success: true, message: "Expense dihapus." });
});
