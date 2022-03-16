const path = require('path');
const sinon = require('sinon');
const Router = require('@koa/router');
const StatusRouter = require(path.join(srcDir, '/services/api/routers/status'));
const StatusController = require(path.join(srcDir, '/services/api/controllers/status'));
const config = require(path.join(srcDir, '../config'));

describe('Router: status', () => {
  let sandbox = null;

  beforeEach(async () => {
    sandbox = sinon.createSandbox();
    this.get = sandbox.stub(Router.prototype, 'get');
  });

  afterEach(() => {
    config.DEMO_ACCOUNT = null;
    sandbox && sandbox.restore();
  });

  it('Should get router', async () => {
    const router = await StatusRouter.router();

    expect(router instanceof Router).to.be.true;
    expect(router.get.calledWith('/', StatusRouter.status)).to.be.true;
  });

  it('Should get status', async () => {
    sandbox.stub(StatusController, 'get').resolves('status');
    const ctx = {
      cacheControl: sandbox.stub(),
    };
    await StatusRouter.status(ctx);

    expect(ctx.body).to.eq('status');

    expect(ctx.cacheControl.calledOnce).to.be.true;
    expect(ctx.cacheControl.calledWith(60 * 1000)).to.be.true;
  });

  it('Should get status with user email', async () => {
    const stubCtrl = sandbox.stub(StatusController, 'get').resolves('status');
    const ctx = {
      cacheControl: sandbox.stub(),
      state: {
        user: {
          email: 'email@email',
        },
      },
    };
    await StatusRouter.status(ctx);

    expect(stubCtrl.calledWith('email@email')).to.be.true;
    expect(ctx.body).to.eq('status');
    expect(ctx.cacheControl.calledOnce).to.be.true;
    expect(ctx.cacheControl.calledWith(60 * 1000)).to.be.true;
  });

  it('Should get status without user email', async () => {
    const stubCtrl = sandbox.stub(StatusController, 'get').resolves('status');
    const ctx = {
      cacheControl: sandbox.stub(),
      state: {},
    };
    await StatusRouter.status(ctx);

    expect(stubCtrl.calledWith(null)).to.be.true;
  });
});
