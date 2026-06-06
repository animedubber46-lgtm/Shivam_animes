import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import animeRouter from "./anime";
import episodesRouter from "./episodes";
import solveLinksRouter from "./solveLinks";
import userFeaturesRouter from "./userFeatures";
import analyticsRouter from "./analytics";
import posterSearchRouter from "./posterSearch";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(animeRouter);
router.use(episodesRouter);
router.use(solveLinksRouter);
router.use(userFeaturesRouter);
router.use(analyticsRouter);
router.use(posterSearchRouter);

export default router;
