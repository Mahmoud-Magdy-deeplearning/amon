const path = require('path');
const Models = require(path.join(srcDir, '/models/pg'));
const sequelizeMockingMocha = require('sequelize-mocking').sequelizeMockingMocha;
const sinon = require('sinon');
const DB = require('../../../../src/modules/db');

describe('Model: Meta', () => {
  let sandbox = null;

  sequelizeMockingMocha(DB.sequelize, [], { logging: false });

  beforeEach(async () => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox && sandbox.restore();
  });

  it('Should create & get', async () => {
    await Models.Meta.createMeta('k', { a: 1 });

    const meta = await Models.Meta.getMeta('k');

    expect(meta.key).to.eq('k');
    expect(meta.data.a).to.eq(1);
  });

  it('Should create or get', async () => {
    await Models.Meta.createOrGetMeta('j');

    const meta = await Models.Meta.getMeta('j');

    expect(meta.key).to.eq('j');
    expect(Object.keys(meta.data).length).to.eq(0);
  });

  it('Should get data', async () => {
    const meta = await Models.Meta.createMeta('k', { a: 1 });

    expect(meta.getAllValues()).to.deep.eq({ a: 1 });
    expect(meta.getValue('a')).to.eq(1);
    expect(meta.getValue('b')).not.to.exist;
  });

  it('Should set data', async () => {
    const meta = await Models.Meta.createMeta('k', { a: 1 });

    await meta.setValue('b', 2);

    expect(meta.getValue('a')).to.eq(1);
    expect(meta.getValue('b')).to.eq(2);

    await meta.reload();

    expect(meta.getValue('a')).to.eq(1);
    expect(meta.getValue('b')).to.eq(2);
  });

  it('Should delete data', async () => {
    const meta = await Models.Meta.createMeta('k');

    await meta.setValue('b', 2);
    expect(meta.getValue('b')).to.eq(2);
    await meta.setValue('b');
    await meta.reload();
    expect(meta.getValue('b')).not.to.exist;
  });
});
