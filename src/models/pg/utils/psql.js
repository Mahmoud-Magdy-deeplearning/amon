const child_process = require('child_process');
const logger = require('../../../modules/logger');

const llo = logger.logMeta.bind(null, { service: 'psql' });

function call(...args) {
  const res = child_process.spawnSync(...args);

  if (res.error) {
    throw new Error(res.error.toString());
  } else if (res.stderr.length > 0) {
    logger.info(res, llo({}));
    throw new Error(res.stderr.toString());
  }
  return res.stdout.toString();
}

const PSQL = {
  dropdb() {
    const res = call('/usr/local/bin/dropdb', ['--username=postgres', '--host=localhost', 'compare'], {
      env: {
        PGPASSWORD: 'pwdpostgre',
      },
    });
    logger.info('dropped', llo({ res }));
  },

  createdb() {
    const res = call('/usr/local/bin/createdb', ['--username=postgres', '--host=localhost', 'compare'], {
      env: {
        PGPASSWORD: 'pwdpostgre',
      },
    });
    logger.info('created db', llo({ res }));
  },

  psql() {
    const res = call('/usr/local/bin/createdb', ['--username=postgres', '--host=localhost', 'compare'], {
      env: {
        PGPASSWORD: 'pwdpostgre',
      },
    });
    logger.info('created db', llo({ res }));
  },

  dump() {
    const dump = call(
      '/usr/local/bin/pg_dump',
      ['--dbname=compare', '--username=postgres', '--host=localhost', '--port=5432', '--insert'],
      {
        env: {
          PGPASSWORD: 'pwdpostgre',
        },
      }
    );
    logger.info('dumped', llo({}));

    return dump;
  },
};

module.exports = PSQL;
