const app = require('./app');
const Utils = require('../../helpers/utils');

const APIService = {
  NEED_CONNECTIONS: ['postgre'],

  start() {
    return app();
  },

  stop: Utils.noop,
};

module.exports = APIService;
