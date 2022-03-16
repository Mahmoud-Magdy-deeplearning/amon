const path = require('path');
const sinon = require('sinon');
const Connections = require(path.join(srcDir, 'modules/connections'));
const Migrate = require(path.join(srcDir, 'models/pg/utils/migrate'));

const DB = require('../../../src/modules/db');

describe('Migrations', () => {
  let sandbox = null;

  beforeEach(async () => {
    sandbox = sinon.createSandbox();
    await Connections.open(['postgre']);
    Migrate.SetSequelize(DB.sequelize);
    await DB.sequelize.drop({});
  });

  afterEach(async () => {
    await Migrate.Reset();
    await Connections.close();
    sandbox && sandbox.restore();
  });

  it('all', async () => {
    await Migrate.Reset();
    await Migrate.Migrate();
    await Migrate.Reset();
    await Migrate.Migrate();
  });
});
