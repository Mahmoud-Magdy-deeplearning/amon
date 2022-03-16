const sinon = require('sinon');
const path = require('path');
const logzioNodejs = require('logzio-nodejs');

const ExternalLogger = require(path.join(srcDir, '/modules/logger/external'));
const Formats = require(path.join(srcDir, '/modules/logger/format'));
const config = require(path.join(srcDir, '../config'));

describe('Module: ExternalLogger', () => {
  let sandbox = null;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  after(() => {
    sandbox && sandbox.restore();
  });

  describe('Log', () => {
    it('Should instantiate', () => {
      const externalLogger = new ExternalLogger({
        name: 'external-logger',
        level: 'verbose',
      });

      expect(externalLogger.logzioLogger).not.to.exist;
      expect(externalLogger.logzioLogger).not.to.exist;
    });

    it('Should log', () => {
      const externalLogger = new ExternalLogger({
        name: 'external-logger',
        level: 'verbose',
      });

      const spyFormatMeta = sandbox.spy(Formats, 'formatMeta');
      const stubCallback = sandbox.stub();

      externalLogger.log({ p: 'p1' }, stubCallback);

      expect(spyFormatMeta.calledOnce).to.be.true;
      expect(spyFormatMeta.calledWith({ p: 'p1' })).to.be.true;
      expect(stubCallback.calledOnce).to.be.true;
    });

    it('Should log with logzio', () => {
      const oldConfigLogzioKey = config.LOG.LOGZIO_KEY;
      config.LOG.LOGZIO_KEY = 'logzio-key';

      const mockLogzio = {
        log: sandbox.stub(),
      };

      const stubLogzioCreateLogger = sandbox.stub(logzioNodejs, 'createLogger').returns(mockLogzio);

      const externalLogger = new ExternalLogger({
        name: 'external-logger',
        level: 'verbose',
      });

      expect(stubLogzioCreateLogger.calledOnce).to.be.true;
      expect(
        stubLogzioCreateLogger.calledWith({
          token: 'logzio-key',
          host: 'listener.logz.io',
          type: 'backend',
          protocol: 'https',
        })
      ).to.be.true;
      expect(externalLogger.logzioLogger).to.be.eq(mockLogzio);
      config.LOG.LOGZIO_KEY = oldConfigLogzioKey;

      const stubCallback = sandbox.stub();
      externalLogger.log(
        {
          level: 'info',
          machine: 'machine1',
          message: 'message1',
          p: 'p1',
        },
        stubCallback
      );

      expect(mockLogzio.log.calledOnce).to.be.true;
      expect(
        mockLogzio.log.calledWith({
          level: 'info',
          machine: 'machine1',
          message: 'message1',
          meta: { p: 'p1' },
        })
      ).to.be.true;
    });

    describe('Sentry', () => {
      beforeEach(() => {
        this.oldConfigSentryDSN = config.LOG.SENTRY_DSN;
        config.LOG.SENTRY_DSN = 'https://45647@o11234.ingest.sentry.io/1234567';

        this.externalLogger = new ExternalLogger({
          name: 'external-logger',
          level: 'verbose',
        });

        this.mockSentry = {
          setExtra: sandbox.stub(),
          captureMessage: sandbox.stub(),
        };
        this.externalLogger.sentry = this.mockSentry;
        this.stubCallback = sandbox.stub();
      });

      afterEach(() => {
        config.LOG.SENTRY_DSN = this.oldConfigSentryDSN;
      });

      it('Should not log with sentry no error message', () => {
        expect(this.externalLogger.sentry).to.be.exist;

        this.externalLogger.log(
          {
            level: 'info',
            machine: 'machine1',
            message: 'message1',
            p: 'p1',
          },
          this.stubCallback
        );

        expect(this.mockSentry.setExtra.callCount).to.be.eq(0);
        expect(this.mockSentry.captureMessage.callCount).to.be.eq(0);
        expect(this.stubCallback.calledOnce).to.be.true;
      });

      it('Should not log with sentry error exposed message', () => {
        const error = new Error('fake-error1');
        error.exposeCustom_ = true;

        this.externalLogger.log(
          {
            level: 'error',
            machine: 'machine1',
            message: 'message1',
            tags: ['tag1'],
            error: error,
            p: 'p1',
          },
          this.stubCallback
        );

        expect(this.mockSentry.setExtra.callCount).to.be.eq(0);
        expect(this.mockSentry.captureMessage.callCount).to.be.eq(0);
        expect(this.stubCallback.calledOnce).to.be.true;
      });

      it('Should log with sentry error', () => {
        const log = {
          level: 'error',
          machine: 'machine1',
          message: 'message1',
          tags: ['tag1'],
          error: new Error('fake-error1'),
          p: 'p1',
        };

        this.externalLogger.log(log, this.stubCallback);

        expect(this.mockSentry.setExtra.calledOnce).to.be.true;
        expect(this.mockSentry.setExtra.args[0][0]).to.be.eq('info');
        expect(this.mockSentry.setExtra.args[0][1]).to.be.deep.eq(log);

        expect(this.mockSentry.captureMessage.calledOnce).to.be.true;
        expect(this.mockSentry.captureMessage.args[0][0].message).to.be.eq('message1 - fake-error1');
        expect(this.stubCallback.calledOnce).to.be.true;
      });

      it('Should log with sentry error with user', () => {
        const log = {
          level: 'error',
          machine: 'machine1',
          message: 'message1',
          tags: ['tag1'],
          error: new Error('fake-error1'),
          p: 'p1',
          userId: 'userId1',
        };

        this.externalLogger.log(log, this.stubCallback);

        expect(this.mockSentry.setExtra.calledOnce).to.be.true;
        expect(this.mockSentry.setExtra.args[0][0]).to.be.eq('info');
        expect(this.mockSentry.setExtra.args[0][1]).to.be.deep.eq(log);

        expect(this.mockSentry.captureMessage.calledOnce).to.be.true;
        expect(this.mockSentry.captureMessage.args[0][0].message).to.be.eq('message1 - fake-error1');
        expect(this.stubCallback.calledOnce).to.be.true;
      });
    });
  });

  describe('Purge', () => {
    beforeEach(() => {
      this.externalLogger = new ExternalLogger({
        name: 'external-logger',
        level: 'verbose',
      });
    });

    it('Should purge', () => {
      expect(this.externalLogger.purge()).to.be.true;
    });

    it('Should purge with logzio', () => {
      this.externalLogger.logzioLogger = {
        sendAndClose: sandbox.stub(),
      };

      expect(this.externalLogger.purge()).to.be.true;

      expect(this.externalLogger.logzioLogger.sendAndClose.calledOnce).to.be.true;
    });

    it('Should purge sentry', () => {
      this.externalLogger.sentry = {
        close: sandbox.stub(),
      };

      expect(this.externalLogger.purge()).to.be.true;

      expect(this.externalLogger.sentry.close.calledOnce).to.be.true;
    });
  });
});
