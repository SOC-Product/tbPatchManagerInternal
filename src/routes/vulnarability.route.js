import express from 'express';
import vulnerabilityController from '../controllers/vulnerability.controller.js';
import { uploadCsvFileMiddleware } from '../middleware/upload.middleware.js';

const router = express.Router();

router
  .post('/parseCsvVulnerability', uploadCsvFileMiddleware ,vulnerabilityController.parseCsvVulnerability)
  .post('/addVulnerability', vulnerabilityController.addLinuxVulnerability)
  .post('/addWindowsVulnerability', vulnerabilityController.addWindowsVulnerability)

export default router;