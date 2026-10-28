import { Hono } from "hono";
import { protect } from "../middleware/auth";
import * as ctrl from "../controllers/bookingController";

const router = new Hono<{ Variables: { user: any } }>();

router.use(protect);
router.get("/", ctrl.list);
router.get("/:id", ctrl.get);
router.post("/", ctrl.create);
router.patch("/:id/confirm", ctrl.confirm);
router.patch("/:id/cancel", ctrl.cancel);
router.patch("/:id/complete", ctrl.complete);

export default router;
