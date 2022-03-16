const Transport = require('winston-transport');
const logzioNodejs = require('logzio-nodejs');
const Format = require('./format');
const Config = require('../../../config');
const { Dedupe } = require('@sentry/integrations');
const Sentry = require('@sentry/node');

class ExternalLogger extends Transport {
  constructor(opts) {
    super(opts);

    if (Config.LOG.LOGZIO_KEY) {
      this.logzioLogger = logzioNodejs.createLogger({
        token: Config.LOG.LOGZIO_KEY,
        host: 'listener.logz.io',
        type: 'backend',
        protocol: 'https',
      });
    }

    if (Config.LOG.SENTRY_DSN) {
      Sentry.init({
        dsn: Config.LOG.SENTRY_DSN,
        serverName: 'backend',
        environment: Config.ENVIRONMENT,
        integrations: [new Dedupe()],
      });
      this.sentry = Sentry;
    }
  }

  log(info, callback) {
    const msg = Format.formatMeta(info);

    if (this.logzioLogger) {
      this.logzioLogger.log(msg);
    }

    if (info.level === 'error' && this.sentry && info.error instanceof Error && !info.error.exposeCustom_) {
      info.error.message = `${info.message} - ${info.error.message}`;
      this.sentry.setExtra('info', info);
      this.sentry.captureMessage(info.error);
    }

    callback();
  }

  purge() {
    if (this.logzioLogger) {
      this.logzioLogger.sendAndClose();
    }

    if (this.sentry) {
      this.sentry.close();
    }

    return true;
  }
}

module.exports = ExternalLogger;
