import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import vehiclesRouter from "./vehicles.js";
import driversRouter from "./drivers.js";
import ordersRouter from "./orders.js";
import assignmentsRouter from "./assignments.js";
import dashboardRouter from "./dashboard.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(vehiclesRouter);
router.use(driversRouter);
router.use(ordersRouter);
router.use(assignmentsRouter);
router.use(dashboardRouter);

export default router;
