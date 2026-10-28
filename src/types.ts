// ---------- Roles & categories (matching service_types.category enum) ----------
export type UserRole = "admin" | "staff";
export type ServiceCategory = "kecil" | "besar" | "berat";

// Prisma partial helper (geboalkan field, bukan nullable)
export type PrismaSelect<T extends Record<string, any>> = { [K in keyof T]?: T[K] };

// ---------- Auth context (stored on Hono context by protect middleware) ----------
export interface AuthVariables {
  user: { id: string; role: "admin" | "staff"; bengkelId: string } | null;
}

// ---------- DTO (request) shape umum ----------
export type CreateDTO<T> = Partial<T>;
export type UpdateDTO<T> = Partial<T>;
