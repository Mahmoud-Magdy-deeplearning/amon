const Router = require('@koa/router');
const StatusRouter = require('./status');
const RobotsRouter = require('./robots');
const CoinRouter = require('./coin');

const MainRouter = {
  router() {
    const statusRouter = StatusRouter.router();
    const robotsRouter = RobotsRouter.router();
    const coinRouter = CoinRouter.router();

    const mainRouter = Router();

    mainRouter.use(statusRouter.routes(), statusRouter.allowedMethods());
    mainRouter.use(robotsRouter.routes(), robotsRouter.allowedMethods());

    mainRouter.use('/coin', coinRouter.routes(), coinRouter.allowedMethods());

    return mainRouter;
  },
};

module.exports = MainRouter;
