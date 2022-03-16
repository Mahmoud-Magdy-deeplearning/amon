const sinon = require('sinon');
const path = require('path');
const Monitoring = require(path.join(srcDir, '/helpers/monitoring'));
const logger = require(path.join(srcDir, '/modules/logger'));

function tightWork(duration) {
  var start = Date.now();
  while (Date.now() - start < duration) {
    for (var i = 0; i < 1e5; ) i++;
  }
}

describe('Module: Monitoring', () => {
  let sandbox = null;

  beforeEach(function () {
    sandbox = sinon.createSandbox();
    Monitoring.toobusy.maxLag(10);
    Monitoring.toobusy.interval(50);
  });

  after(function () {
    Monitoring.toobusy.maxLag(70);
    Monitoring.toobusy.interval(500);
    sandbox && sandbox.restore();
  });

  it.skip('logs if too much work', (done) => {
    const warn = sandbox.stub(logger, 'warn');

    function load() {
      if (warn.callCount > 0) {
        expect(warn.args[0][0]).to.eq('too_busy');
        return done();
      }
      tightWork(100);
      setTimeout(load, 0);
    }
    load();
  });
});
