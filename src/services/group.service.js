import { query } from '../config/database.js';
import { SCRIPT } from '../constants/script.js';
import { _validateGroupData } from '../validations/group.validation.js';
import { sendErrorResponse } from '../utils/sendError.js';
import { sendSuccessPagination, sendSuccessResponse } from '../utils/sendSuccess.js';
import { formatZodErrors } from '../utils/formatZodError.js';
import { createGroup, updateGroup } from '../helpers/group.helper.js';

export const groupService = {};

groupService.createGroup = async (data) => {
    const validatedData = _validateGroupData.safeParse(data);

    if (!validatedData.success) {
        return sendErrorResponse(400, formatZodErrors(validatedData.error));
    }

    return createGroup(validatedData.data);
};

groupService.getGroups = async (limit, page, search) => {
    
    const count = await query(SCRIPT.GET_GROUP_COUNT_BY_SEARCH, [search]);
    const groups = await query(SCRIPT.GET_GROUPS_BY_SEARCH, [search, limit, page * limit]);
    return sendSuccessPagination(200, 'Groups fetched successfully', groups.rows, limit, page, count.rows[0].count);
}

groupService.getGroupById = async (id) => {
    const groupExists = await query(SCRIPT.GET_GROUP_BY_ID, [id]);
    if(groupExists.rowCount === 0) {
        return sendErrorResponse(404, 'Group not found');
    }
    const group = await query(SCRIPT.GET_GROUP_DETAIL_AND_ASSETS_BY_ID, [id]);
    return sendSuccessResponse(200, 'Group fetched successfully', group.rows[0]);
}

groupService.deleteGroup = async (id) => {
    try {
        await query(SCRIPT.BEGIN_TRANSACTION, [], { isWrite: true });

        const groupExists = await query(SCRIPT.GET_GROUP_BY_ID, [id]);
        if(groupExists.rowCount === 0) {
            return sendErrorResponse(404, 'Group not found');
        }
        await query(SCRIPT.DELETE_GROUP_ASSET_MAPPING, [id], { isWrite: true });
        await query(SCRIPT.DELETE_GROUP, [id], { isWrite: true });
        await query(SCRIPT.COMMIT, [], { isWrite: true });
        return sendSuccessResponse(200, 'Group deleted successfully');
    } catch (error) {
        await query(SCRIPT.ROLLBACK, [], { isWrite: true });
        return sendErrorResponse(500, error.message || 'Internal server error');
    }
}

groupService.updateGroup = async (id, data) => {
    const validatedData = _validateGroupData.safeParse(data);
    if (!validatedData.success) {
        return sendErrorResponse(400, formatZodErrors(validatedData.error));
    }

    const groupExists = await query(SCRIPT.GET_GROUP_BY_ID, [id]);
    if(groupExists.rowCount === 0) {
        return sendErrorResponse(404, 'Group not found');
    }
    return updateGroup(id, validatedData.data);

}

export default groupService;