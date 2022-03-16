const path = require('path');
const chaiAsPromised = require('chai-as-promised');
const logger = require('../src/modules/logger');
const chaiDateString = require('chai-date-string');

logger.transports[0].level = 'silly';

global.srcDir = path.resolve(path.join(__dirname, '../src'));

global.chai = require('chai');
global.expect = global.chai.expect;
global.chai.use(chaiAsPromised);
global.chai.use(chaiDateString);

process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
  debugger; // eslint-disable-line no-debugger

  process.exit(-1); // eslint-disable-line no-process-exit
});
