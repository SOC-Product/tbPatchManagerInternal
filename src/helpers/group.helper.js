import { query } from '../config/database.js';
import { SCRIPT } from '../constants/script.js';
import { sendErrorResponse } from '../utils/sendError.js';
import { sendSuccessResponse } from '../utils/sendSuccess.js';

export const createGroup = async (data) => {
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