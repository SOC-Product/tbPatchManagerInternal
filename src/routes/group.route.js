import express from 'express';
import {groupController} from '../controllers/group.controller.js';

const router = express.Router();

router.route('/')
    .post(groupController.createGroup)
    .get(groupController.getGroups);
    
router.route('/kpi')
    .get(groupController.getKpiData)
router.route('/:id')
    .get(groupController.getGroupById)
    .put(groupController.updateGroup)
    .delete(groupController.deleteGroup);

export default router;