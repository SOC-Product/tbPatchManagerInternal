import express from "express";
import hostRouter from "./host.route.js";
import groupRouter from "./group.route.js";
const router = express.Router();

// Mount host routes
router.use("/hosts", hostRouter);
router.use("/group", groupRouter);

export default router;