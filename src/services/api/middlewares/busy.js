const errors = require('../../../helpers/errors');
const Monitoring = require('../../../helpers/monitoring');

module.exports = () => async (ctx, next) => {
  if (Monitoring.toobusy()) {
    errors.throwExposable('too_busy');
  } else {
    await next();
  }
};
