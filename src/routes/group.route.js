import express from 'express';
import {groupController} from '../controllers/group.controller.js';

const router = express.Router();

router.route('/')
    .post(groupController.createGroup)
    .get(groupController.getGroups);

export default router;