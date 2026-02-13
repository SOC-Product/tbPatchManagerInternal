import express from "express";
import hostRouter from "./host.route.js";
import groupRouter from "./group.route.js";
import vulnerabilityRouter from "./vulnarability.route.js"
import patchRouter from "./patch.route.js"
const router = express.Router();

// Mount host routes
router.use("/hosts", hostRouter);
router.use("/group", groupRouter);
router.use("/vulnerability", vulnerabilityRouter);
router.use("/patch", patchRouter);

export default router;