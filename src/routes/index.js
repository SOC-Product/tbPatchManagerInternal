import express from "express";
import hostRouter from "./host.route.js";
import groupRouter from "./group.route.js";
import vulnerabilityRouter from "./vulnarability.route.js"
const router = express.Router();

// Mount host routes
router.use("/host", hostRouter);
router.use("/group", groupRouter);
router.use("/vulnerability", vulnerabilityRouter);

export default router;