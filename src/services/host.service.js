import { query } from '../config/database.js';
import { SCRIPT } from '../constants/script.js';

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

hostService.createAdHost = async (hostData) => {
  const startTime = Date.now();

  try {
    if (!hostData || !hostData.name) {
      return {
        status: 400,
        message: 'Host name is required',
        data: null,
        duration: `${Date.now() - startTime}ms`,
      };
    }

    if (hostData.name.length > 255) {
      return {
        status: 400,
        message: 'Host name must be 255 characters or less',
        data: null,
        duration: `${Date.now() - startTime}ms`,
      };
    }

    const fieldMapping = {
      name: 'computer_name',
      type: 'type',
      criticality: 'criticality',
      status: 'status',
      location: 'location',
      owner: 'owner',
      operatingSystem: 'operating_system',
      ipAddress: 'ip',
      username: 'username',
      password: 'password',
      source: 'source',
    };

    const allowedFields = Object.keys(fieldMapping);
    const fields = [];
    const values = [];
    const placeholders = [];
    let paramIndex = 1;

    allowedFields.forEach((userField) => {
      const dbField = fieldMapping[userField];
      const value = hostData[userField];

      if (value !== undefined && value !== null) {
        if (typeof value === 'string' && value.length > 255) {
          throw new Error(`${userField} must be 255 characters or less`);
        }

        fields.push(dbField);
        values.push(value);
        placeholders.push(`$${paramIndex}`);
        paramIndex += 1;
      }
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
    const duration = Date.now() - startTime;

    return {
      status: 201,
      message: 'Host created successfully',
      data: result.rows[0],
      duration: `${duration}ms`,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('---------ERROR WHILE CREATING HOST-----', {
      message: error.message,
      stack: error.stack,
      hostData: hostData ? { name: hostData.name } : null,
      duration: `${duration}ms`,
    });

    let status = 500;
    let message = 'Failed to create host';

    if (error.message.includes('must be 255 characters or less')) {
      status = 400;
      message = error.message;
    } else if (error.message.includes('duplicate key value violates unique constraint')) {
      status = 409;
      message = 'Host already exists';
    }

    return {
      status,
      message,
      data: null,
      duration: `${duration}ms`,
    };
  }
};

export default hostService;