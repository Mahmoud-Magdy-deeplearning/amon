const path = require('path');
const sinon = require('sinon');
const sequelizeMockingMocha = require('sequelize-mocking').sequelizeMockingMocha;

const config = require(path.join(srcDir, '../config'));
const DB = require(path.join(srcDir, '/modules/db'));
const Models = require(path.join(srcDir, '/models/pg'));
const MetaConfig = require(path.join(srcDir, '/modules/metaConfig'));

describe('Modules: MetaConfig', () => {
  let sandbox = null;

  sequelizeMockingMocha(DB.sequelize, [], { logging: false });

  beforeEach(async () => {
    sandbox = sinon.createSandbox();

    MetaConfig.configSource = {};
    this.metaConf = await Models.Meta.createMeta('Config', {});
  });

  afterEach(async () => {
    sandbox && sandbox.restore();
  });

  it('reload', async () => {
    const loadFromEnv = sandbox.stub(MetaConfig, 'loadFromEnv');
    const loadFromDb = sandbox.stub(MetaConfig, 'loadFromDb');

    await MetaConfig.reload();

    expect(loadFromEnv.calledWith(true)).to.be.true;
    expect(loadFromDb.calledWith()).to.be.true;
  });

  it('Load from env', () => {
    MetaConfig.configSource = { _OKOKOK: '1' };
    MetaConfig.loadFromEnv(true);
    expect(Object.keys(MetaConfig.configSource).length).to.be.gt(0);
    expect(MetaConfig.configSource._OKOKOK).not.to.exist;

    MetaConfig.configSource = { _OKOKOK: '1' };
    MetaConfig.loadFromEnv();
    expect(MetaConfig.configSource._OKOKOK).to.eq('1');
  });

  it('Load from db', async () => {
    await this.metaConf.setValue('VAR_A', '1');
    await this.metaConf.setValue('VAR_B', '2');

    MetaConfig.configSource = { _OKOKOK: '1' };
    await MetaConfig.loadFromDb(true);
    expect(Object.keys(MetaConfig.configSource).length).to.be.gt(0);
    expect(MetaConfig.configSource._OKOKOK).not.to.exist;

    MetaConfig.configSource = { _OKOKOK: '1' };
    await MetaConfig.loadFromDb();
    expect(MetaConfig.configSource._OKOKOK).to.eq('1');

    await this.metaConf.setValue('VAR_A', 1);
    await expect(MetaConfig.loadFromDb()).to.be.rejectedWith(Error, 'source config not string');

    await this.metaConf.destroy();
    await MetaConfig.loadFromDb(true);
    expect(Object.keys(MetaConfig.configSource).length).to.eq(0);
  });

  it('update config', async () => {
    await this.metaConf.setValue('APP_NAME', 'new app name');

    MetaConfig.loadFromEnv(true);
    await MetaConfig.loadFromDb();

    expect(config.APP_NAME).to.eq('new app name');
  });

  it('set in db', async () => {
    await MetaConfig.setInDb('APP_NAME', 'new app name');
    expect(config.APP_NAME).to.eq('new app name');
  });

  it('delete config', async () => {
    await MetaConfig.setInDb('APP_NAME', 'new app name');
    await MetaConfig.setInDb('APP_NAME');
    expect(config.APP_NAME).to.eq('Amon Dev Test');
  });
});
