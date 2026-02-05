import httpStatus from 'http-status';
import hostService from '../services/host.service.js';

const hostController = {};

hostController.getAllHosts = async (req, res) => {
  try {
    const { page, limit, search } = req.query;

    const result = await hostService.getAllHosts({
      page,
      limit,
      search,
    });

    return res.status(result.status).json(result);
  } catch (error) {
    console.error('----INTERNAL SERVER ERROR----', error);

    res
    .status(error.status || httpStatus.INTERNAL_SERVER_ERROR)
    .json(error.message || 'Internal server error');
  }
};

export default hostController;