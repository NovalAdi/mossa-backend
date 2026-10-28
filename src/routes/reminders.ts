import { Hono } from "hono";
import { protect } from "../middleware/auth";
import * as ctrl from "../controllers/reminderController";

const router = new Hono<{ Variables: { user: any } }>();

router.use(protect);
router.get("/", ctrl.list);
router.get("/:id", ctrl.get);
router.post("/", ctrl.create);
router.patch("/:id/toggle", ctrl.toggleActive);
router.post("/:id/trigger", ctrl.trigger);

export default router;
