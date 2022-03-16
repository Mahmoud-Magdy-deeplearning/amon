const compose = require('koa-compose');
const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');
const securityMiddleware = require('./security');
const loggerMiddleware = require('./logger');
const errorMiddleware = require('./error');
const utilsMiddleware = require('./util');

const mainRouter = require('../routers').router();

module.exports = () =>
  compose([
    loggerMiddleware(),
    errorMiddleware(),

    bodyParser({
      enableTypes: ['json', 'form', 'text'],
      jsonLimit: '8mb',
      textLimit: '8mb',
      formLimit: '8mb',
      onerror: utilsMiddleware.onBodyParserError,
    }),

    cors(),

    securityMiddleware(),

    mainRouter.routes(),
    mainRouter.allowedMethods(),
  ]);
