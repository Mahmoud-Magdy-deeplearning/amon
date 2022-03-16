const Sequelize = require('sequelize');
const logger = require('./logger');
const config = require('../../config/index');
const setModels = require('../models/pg/utils/setModels');
const Utils = require('../helpers/utils');
const errors = require('../helpers/errors');

const llo = logger.logMeta.bind(null, { service: 'db' });

const DB = {
  sequelize: null,
  Sequelize: Sequelize,

  setup() {
    console.log(config.DB.URI)
    DB.sequelize = new Sequelize(config.DB.URI, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: config.DB.SSL ? { rejectUnauthorized: false } : false,
      },
      pool: {
        max: config.DB.MAX_CONNECTION,
        min: 0,
        idle: 30 * 1000,
        acquire: 60 * 1000,
      },
      retry: {
        match: [
          // /SequelizeConnectionError/,
          // /SequelizeConnectionRefusedError/,
          // /SequelizeHostNotFoundError/,
          // /SequelizeHostNotReachableError/,
          // /SequelizeInvalidConnectionError/,
          // /SequelizeDatabaseError/,
          /Operation timeout/,
          /SequelizeConnectionAcquireTimeoutError/,
          /Operation timeout/,
          /SequelizeConnectionAcquireTimeoutError: Operation timeout/,
          /TimeoutError: query timed out/,
          /query timed out/,
          /SequelizeConnectionTimedOutError/,
          /TimeoutError/,
          /ResourceRequest timed out/,
          /TimeoutError: ResourceRequest timed out/,
        ],
        max: 10,
      },
      logging: () => 0,
      // logging: (val) => logger.silly('sequelize', llo({ val }))
    });

    setModels(DB.sequelize);
  },

  async transactionOptions() {
    return {
      transaction: await DB.sequelize.transaction({
        isolationLevel: DB.Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE,
      }),
    };
  },

  async connect() {
    if (!DB.sequelize) DB.setup();

    await DB.sequelize.authenticate();
    logger.silly('PostgreSQL successfully connected', llo({}));
  },

  async disconnect() {
    if (!DB.sequelize) return;

    await DB.sequelize.close();
    DB.sequelize = null;
    logger.silly('PostgreSQL successfully disconnected', llo({}));
  },

  isErrorConcurrent(error) {
    return error.message.indexOf('could not serialize access due to concurrent') === 0;
  },

  isErrorDependencies(error) {
    return error.message === 'could not serialize access due to read/write dependencies among transactions';
  },

  isAlreadyCommited(error) {
    return error.message === 'Transaction cannot be rolled back because it has been finished with state: commit';
  },

  /*
  ATTENTION
  Last executed call MUST be a transaction.commit in this callback !
  Otherwise may not detect unattended errors
   */
  async executeTxFn(fn) {
    async function tryFn() {
      const tOpts = await DB.transactionOptions();

      let res = null;

      try {
        res = await fn(tOpts);
        return res;
      } catch (error) {
        if (tOpts.transaction.finished !== 'rollback' && tOpts.transaction.finished !== 'commit') {
          try {
            await tOpts.transaction.rollback();
          } catch (errorRollback) {
            logger.warn('unable to rollback transaction', llo({ error: errorRollback }));
          }
        }

        throw error;
      }
    }

    try {
      const res = await tryFn();
      return res;
    } catch (error) {
      return await DB.handleTxError(error, tryFn);
    }
  },

  async handleTxError(error, retryFn, i = 0) {
    if (DB.isErrorDependencies(error) || DB.isErrorConcurrent(error)) {
      // error.detail = error.original && error.original.detail;
      // delete error.sql;
      // delete error.original;
      // delete error.parent;
      logger.warn('SQL concurrent error', llo({ error }));

      errors.assert(i < 10, 'sql_concurrent', { errorSQL: error });

      await Utils.wait(Math.round(Math.random() * config.DB.RETRY_CONCURRENT_TIME) + 100);

      try {
        return await retryFn();
      } catch (error) {
        return await DB.handleTxError(error, retryFn, ++i);
      }
    } else {
      throw error;
    }
  },
};

DB.setup();

module.exports = DB;
