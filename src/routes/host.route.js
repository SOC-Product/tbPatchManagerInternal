import express from "express";
import hostController from "../controllers/host.controller.js";
import { uploadSSHKey } from "../middleware/upload.middleware.js";

const router = express.Router();

// Host CRUD operations
router
  .route("/")
  .get(hostController.getAllHosts)
  .post(uploadSSHKey.single('ssh_key'), hostController.createAdHost);
  router.route('/kpi')
    .get(hostController.getKpiData)
  router.route('/:id')
  .put(hostController.updateAdHost)
  .delete(hostController.deleteAdHost)
  .get(hostController.getAdHostById);

export default router;
