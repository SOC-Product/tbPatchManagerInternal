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

export const updateGroup = async (id, data) => {
    try {
        //different group with groupname exist
        if(data.name) {
            const existingGroup = await query(SCRIPT.GET_GROUP_BY_NAME, [data.name]);
            if(existingGroup.rows[0].id!=id) return sendErrorResponse(400, `Group already exists with name ${data.name}`);
        }

        await query(SCRIPT.BEGIN_TRANSACTION, [], { isWrite: true });

        //update group details
        await query(SCRIPT.UPDATE_GROUP, [id, data.name, data.risk_tolerance, data.description], { isWrite: true });
        
        //update assets
        if(data.assets && data.assets.length > 0) {
            const existingAssets = await query(SCRIPT.GET_GROUP_ASSETS, [id]);
            const assetsToDelete = existingAssets.rows.filter(asset => !data.assets.includes(asset.host_id));
            if(assetsToDelete.length > 0) {
                await query(SCRIPT.DELETE_ASSETS, [id, assetsToDelete.map(asset => asset.host_id)], { isWrite: true });
            }
            const newAssets = data.assets.filter(asset => !existingAssets.rows.some(existingAsset => existingAsset.host_id === asset));
            if(newAssets.length > 0) {
                const placeholders = newAssets.map(asset => `(${id}, ${asset})`).join(', ');
                await query(SCRIPT.CREATE_GROUP_ASSET_MAPPING(placeholders), [], { isWrite: true });
            }
        }
        await query(SCRIPT.COMMIT, [], { isWrite: true });
        return sendSuccessResponse(200, 'Group updated successfully');
    } catch (error) {
        await query(SCRIPT.ROLLBACK, [], { isWrite: true });
        console.log("---------ERROR IN UPDATE GROUP HELPER---------", error);
        return sendErrorResponse(500, error.message || 'Internal server error');
    }
}