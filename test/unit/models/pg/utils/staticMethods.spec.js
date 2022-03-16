const sinon = require('sinon');
const path = require('path');
const Utils = require(path.join(srcDir, '/models/pg/utils/staticMethods'));

describe('Model: staticMethods', () => {
  let sandbox = null;

  beforeEach(async () => {
    sandbox = sinon.createSandbox();
    this.obj = { a: 1, b: '2', c: true };
  });

  afterEach(() => {
    sandbox && sandbox.restore();
  });

  it('Should convert toObject simple obj', async () => {
    expect(Utils.toObject.bind({ get: () => this.obj })()).to.deep.eq(this.obj);
  });

  it('Should convert toObject with false undefined and null prop', async () => {
    const obj = Object.assign({ d: false, e: undefined, f: null }, this.obj);

    const expectObj = Object.assign({ d: false }, this.obj);
    expect(Utils.toObject.bind({ get: () => obj })()).to.deep.eq(expectObj);
  });
});
