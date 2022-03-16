const Joi = require('joi');
const { throwExposable } = require('./errors');

module.exports = {
  schemas: {
    uuid: Joi.string().guid({
      version: ['uuidv4'],
    }),
    email: Joi.string().trim().lowercase().max(64).email(),
    password: Joi.string().length(64),
    twoFaCode: Joi.string().length(6),
    date: Joi.date().iso().greater('1974-01-01T00:00:00.001Z').less('now'),
    pagination: Joi.object({
      limit: Joi.number().integer().default(10).optional(),
      offset: Joi.number().integer().greater(-1).default(0).optional(),
      order: Joi.string().valid('asc', 'desc').default('desc').optional(),
    }),
  },

  async validateParams(schema, params) {
    try {
      const res = await schema.validateAsync(params, { presence: 'required' });

      return res;
    } catch (error) {
      const validationError = {
        params,
        errors: error.details.map((detail) => detail.message),
      };

      if (validationError.params.password) {
        delete validationError.params.password;
      }

      throwExposable('bad_params', null, null, {
        validationError,
      });
    }
  },
};
