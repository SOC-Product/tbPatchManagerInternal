import helmet from "helmet";
import express from "express";
import cors from "cors";
import router from "../routes/index.js";

import { AssetSyncAdFunction } from "../utils/AssetSyncAd.js";

const ASSET_SYNC_AD_INTERVAL = 1000 * 10 // 10 seconds
export const applyMiddleware = async (app) => {


    app.use(helmet());
    app.use(cors(
        {
            origin: true,
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
        }
    ));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use("/v1/tbpatch/", router);
    app.get("/", (req, res) =>  res.send("Server Health Check"));

    // SYNC AD HOSTS
    setInterval(AssetSyncAdFunction, ASSET_SYNC_AD_INTERVAL);
}
