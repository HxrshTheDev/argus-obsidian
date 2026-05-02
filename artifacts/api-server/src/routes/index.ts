import { Router } from "express";
import healthRouter from "./health.js";
import processRouter from "./process.js";

const router = Router();

router.use(healthRouter);
router.use(processRouter);

export default router;
