const sinon = require('sinon');
const path = require('path');
const logger = require(path.join(srcDir, '/modules/logger'));

describe('Module: Logger', () => {
  let sandbox = null;

  beforeEach(function () {
    sandbox = sinon.createSandbox();
  });

  after(function () {
    sandbox && sandbox.restore();
  });

  it('logMeta', () => {
    const llo = logger.logMeta.bind(null, null, { a: 1 }, { b: 2 });

    const logInfo = llo({ c: 3 });

    expect(logInfo).to.deep.eq({
      a: 1,
      b: 2,
      c: 3,
    });
  });
});
