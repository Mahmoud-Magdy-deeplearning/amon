const path = require('path');
const sinon = require('sinon');
const Router = require('@koa/router');
const config = require(path.join(srcDir, '../config'));
const RobotsRouter = require(path.join(srcDir, '/services/api/routers/robots'));

describe('Router: robots', () => {
  let sandbox = null;

  beforeEach(async () => {
    sandbox = sinon.createSandbox();
    this.get = sandbox.stub(Router.prototype, 'get');
  });

  afterEach(() => {
    sandbox && sandbox.restore();
  });

  it('Should get router', async () => {
    const router = await RobotsRouter.router();

    expect(router instanceof Router).to.be.true;

    expect(router.get.calledWith('/robots.txt', RobotsRouter.get)).to.be.true;
  });

  it('Should get robots.txt', async () => {
    const ctx = {
      cacheControl: sandbox.stub(),
    };
    await RobotsRouter.get(ctx);

    expect(ctx.body).to.eq('User-agent: * \nDisallow: /');
    expect(ctx.cacheControl.calledOnce).to.be.true;
    expect(ctx.cacheControl.calledWith(60 * 60 * 24 * 1000)).to.be.true;
  });

  it('Should get robots.txt prod', async () => {
    const restore = config.ENVIRONMENT;
    config.ENVIRONMENT = 'production';

    const ctx = {
      cacheControl: sandbox.stub(),
    };
    await RobotsRouter.get(ctx);

    expect(ctx.body).to.eq('User-agent: * \nAllow: /');
    expect(ctx.cacheControl.calledOnce).to.be.true;
    expect(ctx.cacheControl.calledWith(60 * 60 * 24 * 1000)).to.be.true;

    config.ENVIRONMENT = restore;
  });
});
