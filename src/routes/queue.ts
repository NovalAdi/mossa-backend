import { Hono } from "hono";
import { protect } from "../middleware/auth";
import * as ctrl from "../controllers/queueController";

const router = new Hono<{ Variables: { user: any } }>();

router.use(protect);
router.get("/", ctrl.list);
router.get("/realtime", ctrl.getRealtime);
router.post("/", ctrl.create);
router.patch("/:id/status", ctrl.updateStatus);

export default router;
