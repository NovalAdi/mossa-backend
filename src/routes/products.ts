import { Hono } from "hono";
import { protect } from "../middleware/auth";
import * as ctrl from "../controllers/productController";

const router = new Hono<{ Variables: { user: any } }>();

router.use(protect);
router.get("/", ctrl.list);
router.get("/:id", ctrl.get);
router.post("/", ctrl.create);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);
router.put("/:id/adjust-stock", ctrl.adjustStock);

export default router;
