import express from 'express';
import vulnerabilityController from '../controllers/vulnerability.controller.js';
import { uploadCsvFile } from '../middleware/upload.middleware.js';

const router = express.Router();

router
  .post('/parseCsvVulnerability', uploadCsvFile.single('file') ,vulnerabilityController.parseCsvVulnerability)
  .post('/addVulnerability', vulnerabilityController.addVulnerability)

export default router;