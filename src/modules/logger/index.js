const winston = require('winston');
const CONFIG = require('../../../config');
const ExternalLogger = require('./external');
const Formats = require('./format');
const Utils = require('../../helpers/utils');

const format = winston.format.combine(...[Formats.formatError(), winston.format.timestamp(), Formats.formatMachine()]);

const externalLogger = new ExternalLogger({
  name: 'external-logger',
  level: 'verbose',
});

const consoleFormat = winston.format.combine(
  ...[CONFIG.REMOTE_EXECUTION ? null : winston.format.colorize(), Formats.consoleFormat({ showDetails: true })].filter(
    (f) => f !== null
  )
);

const consoleLogLevel = CONFIG.REMOTE_EXECUTION ? 'warn' : CONFIG.LOG.LEVEL;
const consoleLogger = new winston.transports.Console({
  name: 'console',
  format: consoleFormat,
  level: consoleLogLevel,
});

const transports = [externalLogger, consoleLogger];

// if(!CONFIG.REMOTE_EXECUTION) {
//   transports.push(
//     new winston.transports.File({ format: consoleFormat, filename: 'error.log', level: 'error' })
//   );
// }

const logger = winston.createLogger({
  level: 'debug',
  exitOnError: true,
  format,
  transports,
});

logger.purge = () => {
  externalLogger.purge();
};

logger.logMeta = (...metas) => Object.assign({}, ...metas);

Utils.defaultError = (error) => logger.error(error.message, { error });

module.exports = logger;
