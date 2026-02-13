import express from 'express';
import patchController from '../controllers/patch.controller';
const router = express.Router();

router.post('/download', patchController.downloadPatch)

export default router;