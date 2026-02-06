import express from 'express';
import hostController from '../controllers/host.controller.js';

const router = express.Router();

// Host CRUD operations
router
  .route('/')
  .get(hostController.getAllHosts)
  .post(hostController.createAdHost);

export default router;