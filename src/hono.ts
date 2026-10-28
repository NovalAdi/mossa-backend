import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { AuthVariables } from "./types";
import { protect } from "./middleware/auth";
import swagger from "hono-swagger-ui";

// ---------- Hono app ----------
export const app = new Hono<{ Variables: AuthVariables }>();

// ---------- Global middleware ----------
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["*"],
    credentials: true,
  }),
);

// ---------- Health (public) ----------
app.get("/api/health", (c) => {
  return c.json({
    success: true,
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// ---------- Route modules ----------
import authRouter from "./routes/auth";
import bengkelRouter from "./routes/bengkel";
import customersRouter from "./routes/customers";
import vehiclesRouter from "./routes/vehicles";
import servicesRouter from "./routes/services";
import productsRouter from "./routes/products";
import queueRouter from "./routes/queue";
import bookingsRouter from "./routes/bookings";
import remindersRouter from "./routes/reminders";
import transactionsRouter from "./routes/transactions";
import expensesRouter from "./routes/expenses";
import inventoryRouter from "./routes/inventory";
import settingsRouter from "./routes/settings";
import { OPENAPI_SPEC } from "./docs/openapi";

// ---------- Swagger UI docs ----------
// `swagger()` hooks `app.route` so the mounted route groups are tracked; it must
// run BEFORE the app.route() calls below.
export const swaggerUI = swagger(app as unknown as Hono, {
  route: "/api/docs",
  title: "Mossa Backend API",
  version: "1.0.0",
  description: "Mossa Backend REST API - Workshops App",
  info: {
    title: "Mossa Backend API",
    version: "1.0.0",
    description: "Mossa Backend REST API documentation",
    contact: { name: "Mossa Team", email: "admin@mossa-backend.com" },
    license: { name: "MIT" },
  },
});

// Serve the authoritative OpenAPI spec at /api/docs/openapi.json.
// It is registered BEFORE swaggerUI.init() so the first-registered route on this
// path wins (Hono v4 matches first-registered), serving this complete spec
// instead of swagger-ui's auto-generated-but-empty spec.
app.get("/api/docs/openapi.json", (c) => c.json(OPENAPI_SPEC));

app.route("/api/auth", authRouter);
app.route("/api/bengkel", bengkelRouter);
app.route("/api/customers", customersRouter);
app.route("/api/vehicles", vehiclesRouter);
app.route("/api/services", servicesRouter);
app.route("/api/products", productsRouter);
app.route("/api/queue", queueRouter);
app.route("/api/bookings", bookingsRouter);
app.route("/api/reminders", remindersRouter);
app.route("/api/transactions", transactionsRouter);
app.route("/api/expenses", expensesRouter);
app.route("/api/inventory", inventoryRouter);
app.route("/api/settings", settingsRouter);

// Register the Swagger routes (they are mounted on `app` by init() below).
app.use("*", swaggerUI.init());

// ---------- 404 fallback ----------
app.notFound((c) =>
  c.json({ success: false, error: `Route ${c.req.method} ${c.req.path} tidak ditemukan.` }, 404),
);

// ---------- Global error handler ----------
app.onError((err, c) => {
  console.error("[Error]", err);
  if ((err as any).code === "P2002") {
    const field = (err as any).meta?.target?.[0] || "field";
    return c.json({ success: false, error: `Duplicate entry: ${field} sudah digunakan.` }, 409);
  }
  if ((err as any).code === "P2025") {
    return c.json({ success: false, error: "Data tidak ditemukan." }, 404);
  }
  return c.json({ success: false, error: "Terjadi kesalahan server." }, 500);
});

export { protect };
