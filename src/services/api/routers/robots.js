const config = require('../../../../config');
const Router = require('@koa/router');

const RobotsRouter = {
  async get(ctx) {
    ctx.cacheControl(60 * 60 * 24 * 1000); // one day

    ctx.body = config.ENVIRONMENT === 'production' ? 'User-agent: * \nAllow: /' : 'User-agent: * \nDisallow: /';
  },

  router() {
    const router = Router();

    /**
     * @api {get} /robots.txt
     * @apiName robots_get
     * @apiGroup Robots
     * @apiDescription Get robots
     *
     * @apiSampleRequest /robots.txt
     *
     * @apiSuccess {String} robots
     */
    router.get('/robots.txt', RobotsRouter.get);

    return router;
  },
};

module.exports = RobotsRouter;
