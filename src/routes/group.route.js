import express from 'express';
import {groupController} from '../controllers/group.controller.js';

const router = express.Router();

router.route('/').post(groupController.createGroup);

export default router;