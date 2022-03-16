const path = require('path');
const sinon = require('sinon');
const Router = require('@koa/router');
const MainRouter = require(path.join(srcDir, '/services/api/routers/index'));
const StatusRouter = require(path.join(srcDir, '/services/api/routers/status'));
const RobotsRouter = require(path.join(srcDir, '/services/api/routers/robots'));
const CoinRouter = require(path.join(srcDir, '/services/api/routers/coin'));

describe('Router: MainRouter', () => {
  let sandbox = null;

  beforeEach(async () => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox && sandbox.restore();
  });

  it('Should get main router', async () => {
    const use = sandbox.stub(Router.prototype, 'use');

    function stubRouter(Rt, name) {
      return sandbox.stub(Rt, 'router').returns({
        routes: sandbox.stub().returns(`${name}Routes`),
        allowedMethods: sandbox.stub().returns(`${name}AllowedMethod`),
      });
    }

    stubRouter(StatusRouter, 'status');
    stubRouter(RobotsRouter, 'robots');
    stubRouter(CoinRouter, 'coin');

    const mainRouter = MainRouter.router();
    expect(mainRouter instanceof Router).to.be.true;

    expect(use.callCount).to.be.eq(3);
    expect(use.calledWith(`statusRoutes`, `statusAllowedMethod`)).to.be.true;
    expect(use.calledWith(`robotsRoutes`, `robotsAllowedMethod`)).to.be.true;

    function expectRouter(name) {
      expect(use.calledWith(`/${name}`, `${name}Routes`, `${name}AllowedMethod`)).to.be.true;
    }

    expectRouter('coin');
  });
});
