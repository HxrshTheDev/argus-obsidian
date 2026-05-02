import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import processRouter from "./process.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(processRouter);

export default router;
