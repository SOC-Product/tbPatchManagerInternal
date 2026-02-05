import express from 'express';
import hostController from '../controllers/host.controller.js';

const router = express.Router();

// Host CRUD operations
router
  .route('/')
  .get(hostController.getAllHosts);

export default router;