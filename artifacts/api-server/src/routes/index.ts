import { Router, type IRouter } from "express";
import healthRouter from "./health";
import assignmentsRouter from "./assignments";
import warehouseRouter from "./warehouse";
import trainingRouter from "./training";
import novaHelpRouter from "./novaHelp";
import novaDemoBrainRouter from "./novaDemoBrain";
import transcribeRouter from "./transcribe";
import requestAccessRouter from "./requestAccess";
import createCheckoutRouter from "./createCheckout";

const router: IRouter = Router();

router.use(healthRouter);
router.use(assignmentsRouter);
router.use(warehouseRouter);
router.use(trainingRouter);
router.use(novaHelpRouter);
router.use(novaDemoBrainRouter);
router.use(transcribeRouter);
router.use(requestAccessRouter);
router.use(createCheckoutRouter);

export default router;
