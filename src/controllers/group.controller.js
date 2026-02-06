import { asyncTryCatch } from '../utils/asyncTryCatch.js';
import { groupService } from '../services/group.service.js';

export const groupController = {};

groupController.createGroup = asyncTryCatch(async (req, res) => {
    const data = req.body;
    const result = await groupService.createGroup(data);
    res.status(result.status || 500).json(result);
});

groupController.getGroups = asyncTryCatch(async (req, res) => {
    const limit = Number(req.query.limit) || 10;
    const page = Number(req.query.page) || 0;
    const search = req.query.search?.trim() || '';
    const result = await groupService.getGroups(limit, page, search);
    res.status(result.status || 500).json(result);
});