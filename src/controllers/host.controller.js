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
    const validation = validateCreateHost.safeParse(hostData);
    if (!validation.success) return res.status(400).json({ status: 400, message: validation.error.issues[0].message });
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

hostController.updateAdHost = async (req, res) => {
  try {
    const hostId = Number(req.params.id);
    const updateData = req.body;
    const sshKeyFile = req.file || null;

    const response = await hostService.updateAdHost(
      hostId,
      updateData,
      sshKeyFile
    );

    return res.status(response.status).json(response);

  } catch (error) {
    console.error('----ERROR WHILE UPDATING HOST----', error);

    return res.status(500).json({
      status: 500,
      message: 'Internal server error'
    });
  }
};



hostController.deleteAdHost = async (req, res) => {
  try {
    const hostId = Number(req.params.id);

    const response = await hostService.deleteAdHost(hostId);

    return res.status(response.status).json(response);

  } catch (error) {
    console.error('----ERROR WHILE DELETING HOST----', error);

    return res.status(500).json({
      status: 500,
      message: 'Internal server error'
    });
  }
};

hostController.getAdHostById = async (req, res) => {
  try {
    const hostId = Number(req.params.id);
    const response = await hostService.getAdHostById(hostId);
    return res.status(response.status).json(response);
  } catch (error) {
    console.error('-----Error While getting host by Id------', error);

    return res.status(500).json({
      status: 500,
      message: 'Internal server error'
    });
  }
};

export default hostController;