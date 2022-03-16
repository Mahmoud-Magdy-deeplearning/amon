const cluster = require('cluster');
const throng = require('throng');
const Connections = require('./connections');
const logger = require('../modules/logger');
const MetaConfig = require('../modules/metaConfig');

require('../helpers/monitoring');

const llo = logger.logMeta.bind(null, { service: 'runner' });

let stopping = false;

function stopApps(apps, code, timeToKill = 20 * 1000) {
  setTimeout(() => {
    process.exit(code); // eslint-disable-line no-process-exit
  }, timeToKill); // Force exit in anyway after timeout

  if (stopping) return;
  stopping = true;

  logger.info('Exiting...');
  logger.purge();

  Promise.all(apps.map((app) => app.stop()))
    .then(() => Connections.close())
    .then(() => process.exit(code)) // eslint-disable-line no-process-exit
    .catch((error) => logger.error('global error', llo({ error })));
}

async function runApps(apps) {
  try {
    process.on('exit', stopApps.bind(null, apps));
    process.on('SIGINT', stopApps.bind(null, apps));
    process.on('SIGTERM', stopApps.bind(null, apps));

    process.on('unhandledRejection', (error) => {
      logger.error('Unhandled Promise Rejection', { error });
      stopApps(apps, -1);
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', { error });
      stopApps(apps, -1);
    });

    const neededConnections = apps.reduce(
      (acc, app) => (app.NEED_CONNECTIONS ? acc.concat(app.NEED_CONNECTIONS) : acc),
      []
    );
    await Connections.open(neededConnections);

    if (neededConnections.find((c) => c === 'postgre')) {
      await MetaConfig.reload();
    }

    await Promise.all(apps.map((app) => app.start()));
  } catch (error) {
    logger.error('Unable to start application', { error });
    logger.purge();
    setTimeout(() => {
      process.exit(-1); // eslint-disable-line no-process-exit
    }, 1000);
  }
}

function clusterApps(apps) {
  const WORKERS = process.env.WEB_CONCURRENCY || 1;

  function masterFunction() {
    logger.info('Master started', llo({}));

    let nbStops = 0;
    let startedAt = Date.now();
    cluster.on('exit', () => {
      nbStops++;
      let uptime = startedAt - Date.now();
      if (nbStops > 3 && uptime < 10 * 1000) {
        logger.error('Too many worker died', { nbStops });
        setTimeout(() => {
          process.exit(-1); // eslint-disable-line no-process-exit
        }, 1000);
        return;
      }
      logger.warn('Worker died, relieving', llo({ nbStops }));
    });
  }

  function startFunction(id) {
    logger.info(`Worker ${id} started`, llo({}));

    runApps(apps).catch((error) => logger.error('run error', llo({ error })));
  }

  throng({
    workers: WORKERS,
    grace: 1000,
    lifetime: Infinity,
    master: masterFunction,
    start: startFunction,
  });
}

function Runner(args) {
  if (!args) throw new Error('need app');

  let apps = args;
  if (!Array.isArray(args)) {
    apps = [args];
  }

  if (process.env.CLUSTERING) {
    clusterApps(apps);
  } else {
    runApps(apps).catch((error) => logger.error('run error', llo({ error })));
  }
}

module.exports = Runner;
