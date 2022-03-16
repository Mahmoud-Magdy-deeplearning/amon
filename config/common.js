const { configParser } = require('../src/helpers/utils');
const servicesConfig = require('./services');

const getConfigObject = (sourceConfig) => ({
  APP_NAME: configParser(sourceConfig, 'string', 'APP_NAME', 'Amon Dev Test'),
  ENVIRONMENT: configParser(sourceConfig, 'string', 'ENVIRONMENT', 'development'),
  NODE_ENV: configParser(sourceConfig, 'string', 'NODE_ENV', 'development'),
  REMOTE_EXECUTION: configParser(sourceConfig, 'bool', 'REMOTE_EXECUTION', false),
  DB: {
    URI: configParser(
      sourceConfig,
      'string',
      'DATABASE_URL',
      'postgres://postgres:pwdpostgre@localhost:5432/amon-test'
    ),
    SSL: configParser(sourceConfig, 'bool', 'DATABASE_SSL', false),
    MAX_CONNECTION: configParser(sourceConfig, 'number', 'DATABASE_MAX_CONNECTION', 50),
    RETRY_CONCURRENT_TIME: configParser(sourceConfig, 'number', 'DATABASE_RETRY_CONCURRENT_TIME', 100),
  },
  LOG: {
    LEVEL: configParser(sourceConfig, 'string', 'LOG_LEVEL', 'verbose'),
    SENTRY_DSN: configParser(sourceConfig, 'string', 'LOG_SENTRY_DSN', null),
    LOGZIO_KEY: configParser(sourceConfig, 'string', 'LOG_LOGZIO_KEY', null),
  },
  SERVICES: servicesConfig.getConfigObject(sourceConfig),
});

module.exports = {
  getConfigObject,
};
