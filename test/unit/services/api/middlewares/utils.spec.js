const path = require('path');
const sinon = require('sinon');

const UtilMiddleware = require(path.join(srcDir, '/services/api/middlewares/util'));

describe('Middleware: utils', () => {
  let sandbox = null;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox && sandbox.restore();
  });

  it('noop', async () => {
    const next = sinon.stub().resolves('next1');
    const ctx = {};

    const res = await UtilMiddleware.noop(ctx, next);

    expect(res).to.be.eq('next1');
    expect(next.calledOnce).to.be.true;
  });

  it('Should handle body parser error when too large', () => {
    const error = new Error('fake-error');
    error.type = 'entity.too.large';

    expect(() => UtilMiddleware.onBodyParserError(error)).to.throw('entity_too_large');
  });

  it('Should handle body parser error when unknown error', () => {
    const error = new Error('fake-error');

    expect(() => UtilMiddleware.onBodyParserError(error)).to.throw('bad_params');
  });
});
