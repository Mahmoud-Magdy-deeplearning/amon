const path = require('path');
const sinon = require('sinon');
const sequelizeMockingMocha = require('sequelize-mocking').sequelizeMockingMocha;
const config = require(path.join(srcDir, '../config'));
const StatusController = require(path.join(srcDir, '/services/api/controllers/status'));
const DB = require(path.join(srcDir, 'modules/db'));

describe('Controller: Status', () => {
  let sandbox = null;

  sequelizeMockingMocha(DB.sequelize, [], { logging: false });

  beforeEach(async () => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    config.DEMO_ACCOUNT = null;
    sandbox && sandbox.restore();
  });

  it('get status', async () => {
    await StatusController.get();
    const status = await StatusController.get();

    expect(Object.keys(status).length).to.be.eq(4);
    expect(status.status).to.eq('healthy');
    expect(status.app_name).to.eq(config.APP_NAME);
    expect(status.environment).to.eq(config.ENVIRONMENT);
    expect(status.time).to.exist;
  });
});
