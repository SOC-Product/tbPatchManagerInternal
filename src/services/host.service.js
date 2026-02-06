import { query } from '../config/database.js';
import { SCRIPT } from '../constants/script.js';
import { CONSTANT } from '../constants/constant.js';

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
  const startTime = Date.now();

  try {
    const fieldMapping = CONSTANT.MANUAL_HOST_COLUMNS;
    const fields = [];
    const values = [];
    const placeholders = [];
    let paramIndex = 1;

     // handle multer file 
    if (sshKeyFile) {
      hostData.ssh_key_file = sshKeyFile.originalname;
      
    }

    Object.entries(fieldMapping).forEach(([userField, dbField]) => {
      let value = hostData[userField];

      if (value === undefined || value === null || value === '') return;

      if (typeof value === 'string') {
        value = value.trim();
      }

      fields.push(dbField);
      values.push(value);
      placeholders.push(`$${paramIndex++}`);
    });

    if (!fields.length) {
      return {
        status: 400,
        message: 'No valid fields provided for host creation',
        data: null,
        duration: `${Date.now() - startTime}ms`,
      };
    }

    const insertQuery = SCRIPT.CREATE_HOST(fields, placeholders);
    const result = await query(insertQuery, values, { isWrite: true });

    return {
      status: 201,
      message: 'Host created successfully',
      data: result.rows[0],
      duration: `${Date.now() - startTime}ms`,
    };

  } catch (error) {
    const duration = Date.now() - startTime;

    console.error('ERROR WHILE CREATING HOST', {
      message: error.message,
      hostData: hostData ? { name: hostData.name } : null,
      duration: `${duration}ms`,
    });

    if (error.message.includes('duplicate key')) {
      return { status: 409, message: 'Host already exists', data: null };
    }

    return { status: 500, message: 'Failed to create host', data: null };
  }
};


export default hostService;