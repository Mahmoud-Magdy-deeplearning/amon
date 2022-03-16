const Models = require('../');
const logger = require('../../../modules/logger');
const DB = require('../../../modules/db');

const llo = logger.logMeta.bind(null, { service: 'db-create' });

async function create() {
  if (!DB.sequelize) {
    await DB.connect();
    logger.info('Connection has been established successfully', llo({}));
  }

  const modelsName = Object.keys(Models);

  logger.info('Create models', llo({ modelsName }));

  await DB.sequelize.query(
    ['CREATE EXTENSION IF NOT EXISTS "uuid-ossp"', 'CREATE EXTENSION IF NOT EXISTS "hstore"'].join(';')
  );

  await DB.sequelize.sync({ force: true });

  logger.info('Populating database', llo({}));
}

/* istanbul ignore if */
if (require.main === module) {
  create()
    .then(() => process.exit(0)) // eslint-disable-line no-process-exit
    .catch((error) => logger.error('global error', llo({ error })));
} else {
  module.exports = create;
}
