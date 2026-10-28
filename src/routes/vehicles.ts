import { Hono } from "hono";
import { protect } from "../middleware/auth";
import * as ctrl from "../controllers/vehicleController";

const router = new Hono<{ Variables: { user: any } }>();

router.use(protect);
router.get("/", ctrl.list);
router.get("/:id", ctrl.get);
router.post("/", ctrl.create);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);

export default router;
