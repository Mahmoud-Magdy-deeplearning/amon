const DB = require('./db');
const logger = require('./logger');
const Utils = require('../helpers/utils');
const errors = require('../helpers/errors');

const llo = logger.logMeta.bind(null, { service: 'connection' });

const Connections = {
  openedConnections: [],

  async open(needConnections) {
    try {
      if (needConnections.find((needConnection) => !['postgre'].includes(needConnection))) {
        errors.throwError('Unknown service to connect to', { needConnections });
      }
      const needConnectionsNotOpened = needConnections.filter(
        (needConnection) =>
          !Connections.openedConnections.find((connectionOpened) => needConnection === connectionOpened)
      );
      if (needConnectionsNotOpened.find((connection) => connection === 'postgre')) {
        await DB.connect();
        Connections.openedConnections.push('postgre');
      }
      logger.verbose('Connections open', llo({}));
      return true;
    } catch (error) {
      logger.warn('Unable to open connections', { error });
      throw error;
    }
  },

  close() {
    return Utils.asyncForEach(Connections.openedConnections, async (connection) => {
      switch (connection) {
        case 'postgre': {
          return DB.disconnect();
        }
        default: {
          return Promise.reject(new Error('Unknown service to disconnect from'));
        }
      }
    })
      .then(() => {
        Connections.openedConnections = [];
        logger.verbose('Connections closed', llo({}));
        logger.purge();
        return Utils.wait(500);
      })
      .catch((error) => {
        logger.error('Unable to close connections', llo({ error }));
        throw error;
      });
  },
};

module.exports = Connections;
