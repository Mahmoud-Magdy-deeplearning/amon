const { configParser } = require('../src/helpers/utils');

const getConfigObject = (sourceConfig) => ({
  API: {
    BASE_URL: configParser(sourceConfig, 'string', 'SERVICES_API_BASE_URL', 'http://localhost:3000'),
    PORT: configParser(sourceConfig, 'number', 'PORT', 3000),
    TIMEOUT: configParser(sourceConfig, 'number', 'SERVICES_API_TIMEOUT', 28), // in second
  },
});

module.exports = {
  getConfigObject,
};
