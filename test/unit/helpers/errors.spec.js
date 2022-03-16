const path = require('path');

const Errors = require(path.join(srcDir, '/helpers/errors'));

describe('Helpers: Errors', () => {
  it('Throw error', async () => {
    let throwError = false;

    try {
      Errors.throwError('cavapas', {
        probleme: 'caca',
      });
    } catch (err) {
      throwError = err;
      expect(err).to.have.property('message', 'cavapas');
      expect(err).to.have.property('probleme', 'caca');
    }

    expect(throwError).be.instanceof(Error);
    expect(throwError.message).to.eq('cavapas');
  });

  it('assert error', async () => {
    let throwError = false;

    try {
      Errors.assert(false, 'cavapas', {
        probleme: 'caca',
      });
    } catch (err) {
      throwError = err;
      expect(err).to.have.property('message', 'cavapas');
      expect(err).to.have.property('probleme', 'caca');
    }

    expect(throwError).be.instanceof(Error);
    expect(throwError.message).to.eq('cavapas');
  });

  it('Throw exposable error', async () => {
    let throwError = false;

    const exposeMeta = { detail: 1 };
    try {
      Errors.throwExposable('unknown_error', 100, 'probleme', exposeMeta);
    } catch (err) {
      throwError = err;
      expect(err).to.have.property('message', 'unknown_error');
      expect(err).to.have.property('exposeCustom_', true);
      expect(err).to.have.property('status', 100);
      expect(err).to.have.property('description', 'probleme');
      expect(err.exposeMeta).to.eq(exposeMeta);
    }

    expect(throwError).be.instanceof(Error);
  });

  it('Assert exposable error', async () => {
    let throwError = false;

    const exposeMeta = { detail: 1 };
    try {
      Errors.assertExposable(false, 'unknown_error', 100, 'probleme', exposeMeta);
    } catch (err) {
      throwError = err;
      expect(err).to.have.property('message', 'unknown_error');
      expect(err).to.have.property('exposeCustom_', true);
      expect(err).to.have.property('status', 100);
      expect(err).to.have.property('description', 'probleme');
      expect(err.exposeMeta).to.eq(exposeMeta);
    }

    expect(throwError).be.instanceof(Error);
  });

  it('Assert true', async () => {
    expect(() =>
      Errors.assert(true, 'cavapas', {
        probleme: 'caca',
      })
    ).not.throw();

    expect(() =>
      Errors.assertExposable(true, 'cavapas', {
        probleme: 'caca',
      })
    ).not.throw();
  });

  it('Throw exposable error defaults', async () => {
    let throwError = false;

    try {
      Errors.throwExposable('unknown_error');
    } catch (err) {
      throwError = err;
      expect(err).to.have.property('message', 'unknown_error');
      expect(err).to.have.property('exposeCustom_', true);
      expect(err).to.have.property('status', 500);
      expect(err).to.have.property('description', 'Unknown Error');
      expect(err).not.to.have.property('exposeMeta');
    }

    expect(throwError).be.instanceof(Error);
  });

  it('Throw exposable fail unknown code', async () => {
    let throwError = false;

    try {
      Errors.throwExposable('fozijfzeoi', 'status', 'description', 'exposeMeta');
    } catch (err) {
      throwError = err;
      expect(err).to.have.property('message', 'unknown_error_code');
      expect(err).not.to.have.property('exposeCustom_');
      expect(err).to.have.property('status');
      expect(err).to.have.property('description');
      expect(err).to.have.property('exposeMeta');
    }

    expect(throwError).be.instanceof(Error);
  });
});
