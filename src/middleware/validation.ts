import { Context, Next } from "hono";
import { ZodSchema } from "zod";

/**
 * Zod validation middleware for Hono.
 * Reads JSON body, validates with the provided ZodSchema,
 * and stores the parsed result in `c.get("body")`.
 */
export const validate =
  (schema: ZodSchema<any>) => async (c: Context, next: Next) => {
    try {
      const parsed = await schema.parseAsync(c.req.json());
      c.set("body", parsed);
      await next();
    } catch (err) {
      if (err instanceof Error && "issues" in err) {
        const issues = (err as { issues: Array<{ path: string[]; message: string }> }).issues;
        const path = issues[0]?.path?.join(".") || "body";
        return c.json({ success: false, error: `Validasi gagal: ${issues[0].message}` }, 400);
      }
      return c.json({ success: false, error: "Invalid request body." }, 400);
    }
  };
