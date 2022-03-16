const errors = require('./../../../helpers/errors');

const UtilMiddleware = {
  noop: async (ctx, next) => next(),

  onBodyParserError: (error) => {
    if (error.type === 'entity.too.large') {
      errors.throwExposable('entity_too_large');
    } else {
      errors.throwExposable('bad_params', null, error.message);
    }
  },
};

module.exports = UtilMiddleware;
