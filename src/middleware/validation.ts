import { Context, Next } from "hono";
import { ZodSchema } from "zod";

/**\n * Zod validation middleware for Hono.
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
        const issues = (err as { issues?: Array<{ path?: string[]; message?: string }> }).issues;
        if (issues && issues.length > 0) {
          const issue = issues[0];
          if (!issue) return;
          const path = issue.path?.join(".") || "body";
          const msg = issue.message || "Validasi gagal";
          return c.json({ success: false, error: `Validasi gagal: ${msg}` }, 400);
        }
      }
      return c.json({ success: false, error: "Invalid request body." }, 400);
    }
  };
