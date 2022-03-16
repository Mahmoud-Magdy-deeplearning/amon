const toobusy = require('toobusy-js');
const logger = require('../modules/logger');

toobusy.maxLag(400);

toobusy.interval(1000);

toobusy.onLag(function (currentLag) {
  logger.warn('too_busy', { currentLag });
});

module.exports = {
  toobusy,
};
