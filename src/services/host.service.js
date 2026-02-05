import { query } from '../config/database.js';
import { SCRIPT } from '../constants/script.js';

export const hostService = {};

hostService.getAllHosts = async (options = {}) => {
  const page = Number(options.page) > 0 ? Number(options.page) : 1;
  const limit = Number(options.limit) > 0 ? Number(options.limit) : 10;
  const search = (options.search || '').trim();

  const offset = (page - 1) * limit;

  const whereClauses = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    whereClauses.push(
      '(computer_name ILIKE $1 OR owner ILIKE $1 OR operating_system ILIKE $1 OR source ILIKE $1 OR status ILIKE $1 OR type ILIKE $1)',
    );
  }

  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Data query with pagination
  const dataSql = `
    ${SCRIPT.GET_ALL_HOSTS}
    ${whereSql}
    ORDER BY computer_name ASC
    LIMIT ${limit} OFFSET ${offset}
  `;

  // Count query for total items (same filter, no pagination)
  const countSql = `
    SELECT COUNT(*) AS total
    FROM hosts
    ${whereSql}
  `;

  const [dataResult, countResult] = await Promise.all([
    query(dataSql, params),
    query(countSql, params),
  ]);

  const total = Number(countResult.rows[0]?.total || 0);
  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;

  return {
    status: 200,
    message: 'Hosts fetched successfully',
    data: dataResult.rows,
    meta: {
      page,
      limit,
      total,
      totalPages,
      search: search || null,
    },
  };
};

export default hostService;