import { Context, Next } from "hono";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "../prisma";

export interface AuthPayload {
  sub: string;
  email: string;
  role: string;
  bengkelId: string;
}

// Read from Cloudflare env (bindings), set di index.ts
// Declare global env vars for Cloudflare Workers
declare global {
  var JWT_SECRET: string;
  var JWT_EXPIRES_IN: string;
}

export const JWT_SECRET = globalThis.JWT_SECRET || "dev-secret-change-me";
export const JWT_EXPIRES_IN = globalThis.JWT_EXPIRES_IN || "7d";

/**
 * Login handler — public (untuk di-protect oleh route layer).
 * Mengembalikan token JWT + info user.
 */
export const login = async (c: Context) => {
  const body = await c.req.json().catch(() => ({}));
  const { email, password } = body as { email?: string; password?: string };

  if (!email || !password) {
    return c.json({ success: false, error: "Email dan password wajib diisi." }, 400);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, passwordHash: true, role: true, bengkelId: true },
  });

  if (!user) {
    return c.json({ success: false, error: "Email atau password salah." }, 401);
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return c.json({ success: false, error: "Email atau password salah." }, 401);
  }

  const token = await new SignJWT({ sub: user.id, email: user.email, role: user.role, bengkelId: user.bengkelId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(globalThis.JWT_EXPIRES_IN || "7d")
    .sign(new TextEncoder().encode(JWT_SECRET));

  return c.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        bengkelId: user.bengkelId,
      },
      token,
    },
  });
};

/**
 * Middleware proteksi route.
 * - Verifikasi token JWT (jose)
 * - Cari user di DB
 * - Simpan user di context (`c.get("user")`)
 * - Lanjut ke handler berikutnya
 */
export const protect = async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ success: false, error: "Tidak ada token. Gunakan Bearer <token>." }, 401);
  }

  const token = authHeader.split(" ")[1];
  const secret = new TextEncoder().encode(JWT_SECRET);
  if (!token) {
    return c.json({ success: false, error: "Tidak ada token. Gunakan Bearer <token>." }, 401);
  }
  try {
    const { payload } = await jwtVerify(token, secret);
    const decoded = payload as unknown as AuthPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, email: true, role: true, bengkelId: true },
    });

    if (!user) {
      return c.json({ success: false, error: "Token tidak valid (user tidak ditemukan)." }, 401);
    }

    c.set("user", { id: user.id, role: user.role as "admin" | "staff", bengkelId: user.bengkelId });
    await next();
  } catch (err) {
    return c.json({ success: false, error: "Token tidak valid atau kadaluarsa." }, 401);
  }
};

/**
 * Role-based access (opsional: allow BOTH jika admin).
 */
export const allowedRoles = (...roles: string[]) => {
  return (c: Context, next: Next) => {
    const user = c.get("user") as { role?: string } | undefined;
    if (!user) {
      return c.json({ success: false, error: "Harus login dulu." }, 401);
    }
    const role = user.role || "";
    if (roles.includes(role)) {
      return next();
    }
    return c.json({ success: false, error: "Akses ditolak. Role tidak cukup." }, 403);
  };
};
