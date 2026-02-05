import express from "express";
import hostRouter from "./host.route.js";

const router = express.Router();

// Mount host routes
router.use("/hosts", hostRouter);

export default router;