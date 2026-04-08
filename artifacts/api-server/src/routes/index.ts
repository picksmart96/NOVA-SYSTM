import { Router, type IRouter } from "express";
import healthRouter from "./health";
import assignmentsRouter from "./assignments";
import warehouseRouter from "./warehouse";
import trainingRouter from "./training";
import novaHelpRouter from "./novaHelp";
import transcribeRouter from "./transcribe";

const router: IRouter = Router();

router.use(healthRouter);
router.use(assignmentsRouter);
router.use(warehouseRouter);
router.use(trainingRouter);
router.use(novaHelpRouter);
router.use(transcribeRouter);

export default router;
