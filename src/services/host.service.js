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

export default hostService;