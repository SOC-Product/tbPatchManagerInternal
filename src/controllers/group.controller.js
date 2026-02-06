import { asyncTryCatch } from '../utils/asyncTryCatch.js';
import { groupService } from '../services/group.service.js';

export const groupController = {};

groupController.createGroup = asyncTryCatch(async (req, res) => {
    const data = req.body;
    const result = await groupService.createGroup(data);
    res.status(result.status || 500).json(result);
});
