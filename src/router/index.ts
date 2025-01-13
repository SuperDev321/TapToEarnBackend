import { Router } from "express";
import { authorize } from "../controller/user";

const router = Router();

router.post("authorize", authorize as any);

export default router;
