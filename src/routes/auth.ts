import { Hono } from "hono";
import { login } from "../middleware/auth";

const router = new Hono<{ Variables: { user: any } }>();

router.post("/login", login);

export default router;
