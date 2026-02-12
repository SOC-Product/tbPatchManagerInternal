import { query } from '../config/database.js';
import { SCRIPT } from '../constants/script.js';
import { CONSTANT } from '../constants/constant.js';
import { processAndSaveSSHKey } from '../utils/sshKeyProcessor.js';
import { sendSuccessResponse } from '../utils/sendSuccess.js';

export const hostService = {};

hostService.getAllHosts = async (limit, page, search) => {
  try {
    let totalCount = 0;
    let response;
    const trimmedSearch = (search || '').trim();
      const searchParam = `%${trimmedSearch}%`;
      const countResult = await query(SCRIPT.GET_HOST_COUNT_BY_SEARCH, [searchParam]);
      totalCount = Number(countResult.rows[0]?.count || 0);
      response = await query(SCRIPT.GET_HOSTS_BY_SEARCH, [searchParam, limit, page * limit]);
    return {
      status: 200,
      message: 'Hosts fetched successfully',
      data: response.rows,
      pagination: {
        page: page,
        limit: limit,
        totalPages: limit ? Math.ceil(totalCount / limit) : 0,
        total: totalCount,
      },
    };
  } catch (error) {
    console.error('---------ERROR WHILE FETCHING HOST LIST-----', error);
    return {
      status: 500,
      message: 'Failed to fetch host list',
    };
  }
};

hostService.createAdHost = async (hostData, sshKeyFile) => {
  try {
    const allowedFields = CONSTANT.MANUAL_HOST_COLUMNS;
    const fields = [];
    const values = [];
    const placeholders = [];
    let paramIndex = 1;

    // multer file handling
    let savedKeyFileName = null;

    if (sshKeyFile) {
      savedKeyFileName = await processAndSaveSSHKey(sshKeyFile, hostData.host_name);
      hostData.ssh_key_file = savedKeyFileName;
    }
    

    allowedFields.forEach((field) => {
      let value = hostData[field];

      if (value === undefined || value === null || value === '') return;

      if (typeof value === 'string') {
        value = value.trim();
      }

      fields.push(field);            
      values.push(value);           
      placeholders.push(`$${paramIndex++}`);
    });

    if (!fields.length) {
      return {
        status: 400,
        message: 'No valid fields provided for host creation',
      };
    }

    const insertQuery = SCRIPT.CREATE_HOST(fields, placeholders);
    const result = await query(insertQuery, values, { isWrite: true });

    return {
      status: 201,
      message: 'Host created successfully',
      data: result.rows[0]
    };

  } catch (error) {

    console.error('ERROR WHILE CREATING HOST', {
      message: error.message,
      hostData: hostData ? { name: hostData.name } : null
    });

    if (error.message.includes('duplicate key')) {
      return { status: 409, message: 'Host already exists',};
    }

    return { status: 500, message: 'Failed to create host',};
  }
};

hostService.updateAdHost = async (hostId, updateData, sshKeyFile) => {
  try {
    if (!hostId) {
      return {
        status: 400,
        message: 'Host ID is required'
      };
    }

    const allowedFields = CONSTANT.MANUAL_HOST_COLUMNS;
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    // multer file support
    if (sshKeyFile) {
      const savedKey = await processAndSaveSSHKey(sshKeyFile, hostId);
      updateData.ssh_key_file = savedKey;
    }    

    // build dynamic update query
    allowedFields.forEach((field) => {
      let value = updateData[field];

      if (value === undefined || value === null || value === '') return;

      if (typeof value === 'string') {
        value = value.trim();
      }

      updateFields.push(`${field} = $${paramIndex++}`);
      values.push(value);
    });

    if (!updateFields.length) {
      return {
        status: 400,
        message: 'No valid fields provided for update'
      };
    }

    // add modified_at automatically
    updateFields.push(`updated_at = $${paramIndex++}`);
    values.push(new Date());

    // add hostId in WHERE clause
    values.push(hostId);

    const updateQuery = SCRIPT.UPDATE_HOST(updateFields);
    const result = await query(updateQuery, values, { isWrite: true });

    if (result.rowCount === 0) {
      return {
        status: 404,
        message: 'Host not found'
      };
    }

    return {
      status: 200,
      message: 'Host updated successfully',
      data: result.rows[0],
    };

  } catch (error) {
    console.error('ERROR WHILE UPDATING HOST', error);

    return {
      status: 500,
      message: 'Failed to update host'
    };
  }
};

hostService.deleteAdHost = async (hostId) => {

  try {
    if (!hostId) {
      return { status: 400, message: 'Host ID is required' };
    }

    const result = await query(SCRIPT.DELETE_HOST, [hostId], { isWrite: true });

    if (result.rowCount === 0) {
      return { status: 404, message: 'Host not found' };
    }

    return {
      status: 200,
      message: 'Host deleted successfully',
    };

  } catch (error) {
    console.error('ERROR WHILE DELETING HOST', error);

    return {
      status: 500,
      message: 'Failed to delete host'
    };
  }
};

hostService.getAdHostById = async (hostId) => {
  try {
    if (!hostId) {
      return {
        status: 400,
        message: 'Host ID is required'
      };
    }

    const result = await query(SCRIPT.GET_HOST_BY_ID, [hostId]);

    if (!result.rows.length) {
      return {
        status: 404,
        message: 'Host not found'
      };
    }

    return {
      status: 200,
      message: 'Host fetched successfully',
      data: result.rows[0]
    };

  } catch (error) {
    console.error('ERROR WHILE FETCHING HOST BY ID', error);

    return {
      status: 500,
      message: 'Failed to fetch host'
    };
  }
};

hostService.getKpiData = async () => {
  const host_kpi = await query(SCRIPT.GET_HOST_KPI);
  const data = host_kpi.rows?.[0] || {};
  return sendSuccessResponse(200, 'Host kpi fetched successfully', {
    total_host: Number(data.total_host) || 0,
    online: Number(data.online) || 0,
    offline: Number(data.offline) || 0,
    critical_patches: Number(data.critical_patches) || 0,
  });
};

export default hostService;