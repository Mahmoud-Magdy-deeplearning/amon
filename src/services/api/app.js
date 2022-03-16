const Koa = require('koa');
const MainMiddleware = require('./middlewares');
const logger = require('../../modules/logger');
const CONFIG = require('../../../config');
const llo = logger.logMeta.bind(null, { service: 'api' });

const API = () =>
  new Promise((resolve, reject) => {
    const app = new Koa();

    app.proxy = CONFIG.REMOTE_EXECUTION;

    app.on('error', (error) => {
      logger.error('Unexpected API error', { error });
    });

    require('koa-ctx-cache-control')(app);

    app.use((ctx, next) => {
      ctx.cacheControl(false);
      return next();
    });

    app.use(MainMiddleware());

    const server = app.listen(CONFIG.SERVICES.API.PORT, (err) => {
      if (err) {
        return reject(err);
      }

      logger.info('Listening', llo({ port: CONFIG.SERVICES.API.PORT }));
      resolve(app);
    });

    server.setTimeout(CONFIG.SERVICES.API.TIMEOUT * 1000);
  });

module.exports = API;
