const os = require('os');
const winston = require('winston');
const config = require('../../../config');
const Utils = require('../../helpers/utils');

const LEVEL = Symbol.for('level');
const MESSAGE = Symbol.for('message');

const Format = {
  formatMeta: (info) => {
    const filteredInfo = Object.assign({}, info);

    delete filteredInfo.level;
    delete filteredInfo.message;
    delete filteredInfo.machine;
    delete filteredInfo.splat;
    delete filteredInfo[LEVEL];
    delete filteredInfo[MESSAGE];

    const nbinfo = Object.keys(filteredInfo).length;
    const newInfo = {
      level: info.level,
      message: info.message,
      machine: info.machine,
    };

    if (nbinfo) {
      newInfo.meta = filteredInfo;
    }

    if (info.error) {
      newInfo.error = Format.formatRecursiveError(info);
    }

    return newInfo;
  },

  formatMachine: winston.format((info) => {
    info.machine = {
      hostname: os.hostname(),
      platform: process.platform,
      pid: process.pid,
    };

    info.environment = config.ENVIRONMENT;
    info.tags = ['backend'];

    return info;
  }),

  formatRecursiveError(info) {
    if (info.error instanceof Error) {
      info.errorCode = info.error.code;
      info.errorStack = info.error.stack;
      info.errorMessage = info.error.message;

      if (info.error.error instanceof Error) {
        info.errorDeep = {
          error: info.error.error,
        };

        info.errorDeep = Format.formatRecursiveError(info.errorDeep);
      }
    }

    return info;
  },

  formatError: winston.format((info) => {
    return Format.formatRecursiveError(info);
  }),

  consoleFormat: winston.format((info, opts) => {
    const filteredInfo = Object.assign({}, info);

    delete filteredInfo.level;
    delete filteredInfo.message;
    delete filteredInfo.splat;
    delete filteredInfo.timestamp;
    delete filteredInfo.machine;
    delete filteredInfo[LEVEL];
    delete filteredInfo[MESSAGE];

    let detailString = '';
    if (opts.showDetails && Object.keys(filteredInfo).length > 0) {
      const detail = Utils.JSONStringifyCircular(filteredInfo).replace(/\\n/g, '\n');
      detailString = `\nDetail : ${detail}`;
    }

    info[MESSAGE] = `${info.timestamp} [${info.level}] ${info.message}${detailString}`;
    return info;
  }),
};

module.exports = Format;
