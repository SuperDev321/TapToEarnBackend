import { Router } from "express";
import { authorize, getMe } from "../controller/user";
import { userMiddleware } from "../middleware/user";

const router = Router();

router.post("/authorize", authorize as any);
router.get("/getMe", userMiddleware, getMe as any);

export default router;
