import "dotenv/config";
import express from "express";
import https from "https";
import fs from "fs";
import { applyMiddleware } from "./src/middleware/index.js";
const app = express();

const PORT = process.env.PORT || 9999;
const SERVER_TYPE = process.env.SERVER_TYPE || "http";

(async () => {
  try {
    console.log("-----STARTING THE SERVER--------");
    
    await applyMiddleware(app);
    
    if (SERVER_TYPE === "https") {
      https.createServer(
          {
            key: fs.readFileSync(process.env.KEY_PATH),
            cert: fs.readFileSync(process.env.CERT_PATH),
          },
          app
        ).listen(PORT, () => {
          console.log(`HTTPS Server is running on port ${PORT}`);
        });
    } 
    else {
      app.listen(PORT, () => {
        console.log(`HTTP Server is running on port ${PORT}`);
      });
    }
    
  } catch (error) {
    console.error("-----ERROR WHILE STARTING THE SERVER--------", error);
    process.exit(1);
  }

})();

process.on("uncaughtException", (error) => {
  console.error("-----UNCAUGHT EXCEPTION----------", error);
  process.exit(1);
});

process.on("unhandledRejection", (error) => {
  console.error("--------UNHANDLED REJECTION---------", error);
  process.exit(1);
});
