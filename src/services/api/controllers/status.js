const moment = require('moment');
const config = require('../../../../config');

const StatusController = {
  get: async () => {
    const status = {
      status: 'healthy',
      app_name: config.APP_NAME,
      environment: config.ENVIRONMENT,
      time: moment.utc().format(),
    };

    return status;
  },
};

module.exports = StatusController;
