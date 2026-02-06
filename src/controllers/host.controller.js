import hostService from '../services/host.service.js';
import { validateCreateHost } from '../validations/host.validation.js';

const hostController = {};

hostController.getAllHosts = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const page = Number(req.query.page) || 0;
    const search = req.query.search?.trim() || '';

    const response = await hostService.getAllHosts(limit, page, search);
    return res.status(response.status).json(response);
  } catch (error) {
    console.error('----ERROR WHILE FETCHING HOST LIST----', error);
    return res.status(500).json({
      status: 500,
      message: 'Internal server error',
    });
  }
};

hostController.createAdHost = async (req, res) => {
  try {
    const hostData = req.body;
    const sshKeyFile = req.file || null;
    const validationError = validateCreateHost(hostData);
    if (validationError) {
      return res.status(400).json({
        status: 400,
        message: validationError,
      });
    }
    const result = await hostService.createAdHost(hostData, sshKeyFile);

    return res.status(result.status).json(result);
  } catch (error) {
    console.error('Error in createAdHost controller:', error);
    return res.status(500).json({
      status: 500,
      message: 'Internal server error',
    });
  }
};

export default hostController;