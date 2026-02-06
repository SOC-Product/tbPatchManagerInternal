import { query } from '../config/database.js';
import { SCRIPT } from '../constants/script.js';
import { _validateGroupData } from '../validations/group.validation.js';
import { sendErrorResponse } from '../utils/sendError.js';
import { sendSuccessPagination } from '../utils/sendSuccess.js';
import { formatZodErrors } from '../utils/formatZodError.js';
import { createGroup } from '../helpers/group.helper.js';

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
