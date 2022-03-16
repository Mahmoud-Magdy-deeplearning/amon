const { Umzug, SequelizeStorage } = require('umzug');
const DB = require('../../../modules/db');
const logger = require('../../../modules/logger');
const PSQL = require('./psql');

const llo = logger.logMeta.bind(null, { service: 'migration' });

function logUmzugEvent(eventName) {
  return function ({ name }) {
    console.log(`${name} ${eventName}`); // eslint-disable-line no-console
  };
}

// https://github.com/abelnation/sequelize-migration-hello

const Migrate = {
  umzug: null,

  SetSequelize(sequelize) {
    if (Migrate.umzug) {
      Migrate.umzug.removeAllListeners();
    }
    const parent = new Umzug({
      storage: new SequelizeStorage({ sequelize }),
      context: sequelize.getQueryInterface(),
      migrations: {
        glob: './src/models/pg/migrations/*.js',
        modelName: 'SequelizeMeta',
        resolve: ({ name, path, context }) => {
          const migration = require(path);
          return {
            name,
            up: async () =>
              DB.executeTxFn(async ({ transaction }) => {
                await migration.up(context, transaction);
                await transaction.commit();
              }),
            down: async () =>
              DB.executeTxFn(async ({ transaction }) => {
                await migration.down(context, transaction);
                await transaction.commit();
              }),
          };
        },
      },
      logging: () => 0,
    });
    Migrate.umzug = new Umzug({
      ...parent.options,
      migrations: async () =>
        (await parent.migrations()).sort((a, b) => {
          const aVersion = /(\d*).*/.exec(a.name)[1];
          const bVersion = /(\d*).*/.exec(b.name)[1];
          return parseInt(aVersion, 10) > parseInt(bVersion, 10) ? 1 : -1;
        }),
    });

    Migrate.umzug.on('migrating', logUmzugEvent('migrating'));
    Migrate.umzug.on('migrated', logUmzugEvent('migrated'));
    Migrate.umzug.on('reverting', logUmzugEvent('reverting'));
    Migrate.umzug.on('reverted', logUmzugEvent('reverted'));
  },

  Status() {
    let result = {};

    return Migrate.umzug
      .executed()
      .then((executed) => {
        result.executed = executed;
        return Migrate.umzug.pending();
      })
      .then((pending) => {
        result.pending = pending;
        return result;
      })
      .then(({ executed, pending }) => {
        const current = executed.length > 0 ? executed[executed.length - 1].name : '<NO_MIGRATIONS>';
        const status = {
          current: current,
          executed: executed.map((m) => m.name),
          pending: pending.map((m) => m.name),
        };

        logger.info('status', llo(status));

        return { executed, pending };
      });
  },

  Migrate() {
    return Migrate.umzug.up();
  },

  MigrateNext() {
    return Migrate.Status().then(({ pending }) => {
      if (pending.length === 0) {
        throw new Error('No pending migrations');
      }
      const next = pending[0].name;
      return Migrate.umzug.up({ to: next });
    });
  },

  Reset() {
    return Migrate.umzug.down({ to: 0 });
  },

  ResetPrev() {
    return Migrate.Status().then(({ executed }) => {
      if (executed.length === 0) {
        throw new Error('Already at initial state');
      }
      const prev = executed[executed.length - 1].name;
      return Migrate.umzug.down({ to: prev });
    });
  },

  HardReset() {
    return new Promise((resolve, reject) => {
      setImmediate(async () => {
        try {
          try {
            PSQL.dropdb();
          } catch (e) {
            logger.info('no existing db to drop', llo({}));
          }
          PSQL.createdb();
          resolve();
        } catch (error) {
          logger.error('HardReset', llo({ error }));
          reject(error);
        }
      });
    });
  },
};

async function commander() {
  if (process.argv.length < 2) {
    throw new Error('need params');
  }
  const cmd = process.argv[2].trim();
  let executedCmd;

  logger.info(`${cmd.toUpperCase()} BEGIN`, llo({}));

  await DB.connect();
  Migrate.SetSequelize(DB.sequelize);

  switch (cmd) {
    case 'status':
      executedCmd = Migrate.Status();
      break;

    case 'up':
    case 'migrate':
      executedCmd = Migrate.Migrate();
      break;

    case 'next':
    case 'migrate-next':
      executedCmd = Migrate.MigrateNext();
      break;

    case 'down':
    case 'reset':
      executedCmd = Migrate.Reset();
      break;

    case 'prev':
    case 'reset-prev':
      executedCmd = Migrate.ResetPrev();
      break;

    case 'reset-hard':
      executedCmd = Migrate.HardReset();
      break;

    default:
      throw new Error(`invalid cmd: ${cmd}`);
  }

  return executedCmd
    .then(async () => {
      const doneStr = `${cmd.toUpperCase()} DONE`;
      logger.info(doneStr, llo({}));
      logger.info('='.repeat(doneStr.length), llo({}));
      return true;
    })
    .catch(async (error) => {
      const errorStr = `${cmd.toUpperCase()} ERROR`;
      logger.error(errorStr, llo({ error }));
    })
    .then(() => {
      if (cmd !== 'status' && cmd !== 'reset-hard') {
        return Migrate.Status();
      }
      return true;
    });
}

/* istanbul ignore if */
if (require.main === module) {
  commander()
    .then(() => process.exit(0)) // eslint-disable-line no-process-exit
    .catch((error) => logger.error('global error', llo({ error })));
} else {
  module.exports = Migrate;
}
