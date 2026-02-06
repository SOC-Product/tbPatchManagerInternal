import { query } from '../config/database.js';
import { SCRIPT } from '../constants/script.js';
import { _validateGroupData } from '../validations/group.validation.js';
import { sendErrorResponse } from '../utils/sendError.js';
import { sendSuccessResponse, sendSuccessPagination } from '../utils/sendSuccess.js';
import { formatZodErrors } from '../utils/formatZodError.js';
export const groupService = {};

const _createGroup = async (data) => {
    try {
        const existingGroup = await query(SCRIPT.GET_GROUP_BY_NAME, [data.name]);
        if(existingGroup.rowCount > 0) {
            return sendErrorResponse(400, `Group already exists with name ${data.name}`);
        }
        const result = await query(SCRIPT.CREATE_GROUP, [data.name, data.risk_tolerance, data.description || null], { isWrite: true });

        if(data.assets && data.assets.length > 0) {
            const placeholders = data.assets.map(asset => `(${result.rows[0].id}, ${asset})`).join(', ');
            await query(SCRIPT.CREATE_GROUP_ASSET_MAPPING(placeholders), [], { isWrite: true });
        }
        return sendSuccessResponse(201, 'Group created successfully', result.rows[0]);
    } catch (error) {
        if(error.success === false) {
            return sendErrorResponse(400, error?.detail || 'Invalid data');
        }
        return sendErrorResponse(500, error.message || 'Internal server error');
    }
}

groupService.createGroup = async (data) => {
    const validatedData = _validateGroupData.safeParse(data);

    if (!validatedData.success) {
        return sendErrorResponse(400, formatZodErrors(validatedData.error));
    }

    return _createGroup(validatedData.data);
};

groupService.getGroups = async (limit, page, search) => {
    
    const count = await query(SCRIPT.GET_GROUP_COUNT_BY_SEARCH, [search]);
    const groups = await query(SCRIPT.GET_GROUPS_BY_SEARCH, [search, limit, page * limit]);
    return sendSuccessPagination(200, 'Groups fetched successfully', groups.rows, limit, page, count.rows[0].count);
}
