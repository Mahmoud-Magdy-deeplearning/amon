const async = require('async');
const Moment = require('moment');
const MomentRange = require('moment-range');
const moment = MomentRange.extendMoment(Moment);
const Decimal = require('decimal.js');
const request = require('request-promise');
const assert = require('assert');

const Utils = {
  noop: () => 0,

  wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  isTrue(b) {
    return b === true || b === 'true';
  },

  getDateRange(startDate, endDate, type = 'days') {
    const fromDate = moment(startDate);
    const toDate = moment(endDate);
    const diff = toDate.diff(fromDate, type);
    const range = [];

    for (let i = 0; i <= diff; i++) {
      range.push(moment(startDate).add(i, type));
    }

    return range;
  },

  randomDigits(length = 6) {
    const max = 10 ** length;
    const min = 10 ** (length - 1);
    return Math.floor(Math.random() * (max - min) + min).toString();
  },

  defaultError(error) {
    console.error(error); // eslint-disable-line no-console
  },

  enumToObject(en) {
    return en.reduce((object, key) => Object.assign(object, { [key]: key }), {});
  },

  setImmediateAsync(fn, onError) {
    fn().catch(onError || Utils.defaultError);
  },

  setIntervalAsync(fn, delay, onError) {
    let timeout = null;
    let running = true;
    let endPromise = Promise.resolve();

    const errorHandler = onError || Utils.defaultError;

    async function launchAndWait() {
      let resolveNoop = Utils.noop;

      try {
        endPromise = new Promise((resolve) => (resolveNoop = resolve)).catch(Utils.noop);

        await fn();
        resolveNoop();
      } catch (error) {
        errorHandler(error);
        resolveNoop();
      } finally {
        if (running) {
          timeout = setTimeout(launchAndWait, delay);
        }
      }
    }

    launchAndWait(fn, delay).catch(errorHandler);

    return (wait = false) => {
      running = false;
      clearTimeout(timeout);
      if (wait) {
        return endPromise;
      } else {
        return null;
      }
    };
  },

  rateLimit(parallel, time, fn) {
    const stack = [];

    let currentRunning = 0;

    function callNext() {
      currentRunning++;

      setTimeout(() => {
        currentRunning--;

        if (currentRunning < parallel && stack.length > 0) {
          callNext();
        }
      }, time);

      const { ctx, args, resolve, reject } = stack.shift();
      fn.apply(ctx, args).then(resolve).catch(reject);
    }

    return function limiter(...args) {
      return new Promise((resolve, reject) => {
        stack.push({ ctx: this, args, resolve, reject });

        if (currentRunning < parallel) {
          callNext();
        }
      });
    };
  },

  chunkPeriod(start, end, unit = 'minutes', step = 1) {
    const range = moment.range(start, end);

    const chunk = Array.from(range.by(unit, { step: step }));

    return chunk.reduce((acc, date, i) => {
      if (i !== chunk.length - 1) {
        acc.push({ start: date, end: chunk[i + 1] });
      }

      return acc;
    }, []);
  },

  removeEmptyStrings(data) {
    return Object.keys(data).reduce((acc, prop) => {
      if (data[prop] !== '' && data[prop] !== undefined) {
        return Object.assign(acc, { [prop]: data[prop] });
      }
      return acc;
    }, {});
  },

  sortByDate(prop, order = 'asc') {
    let reverse = null;
    if (order === 'asc') {
      reverse = 1;
    } else if (order === 'desc') {
      reverse = -1;
    } else {
      throw new Error('invalid order');
    }
    return (a, b) => reverse * (moment.utc(a[prop]) - moment.utc(b[prop]));
  },

  configParser(configSource = process.env, type, key, defaultValue) {
    const val = configSource[key];

    function def(v) {
      return defaultValue === undefined ? v : defaultValue;
    }

    switch (type) {
      case 'string': {
        return val || def('');
      }

      case 'array': {
        return val ? val.split(',') : def([]);
      }

      case 'number': {
        if (!val) return def(0);

        const djs = Decimal(val);
        return djs.toNumber();
      }

      case 'bool': {
        return val ? val === 'true' : def(false);
      }

      default: {
        throw new Error('Unknwon variable type');
      }
    }
  },

  async asyncForEach(array, fn, breakOnFalse = false) {
    for (let index = 0; index < array.length; index++) {
      const res = await fn(array[index], index, array);

      if (breakOnFalse && res === false) {
        break;
      }
    }
  },

  asyncParallel: (tasks, onError) =>
    new Promise((resolve) => {
      const wrappedTasks = async.reflectAll(tasks);

      function callback(err, results) {
        const successResults = results.filter((res) => !!res.value).map((res) => res.value);
        const errorResults = results.filter((res) => !!res.error).map((res) => res.error);

        errorResults.forEach((error) => onError && onError(error));
        resolve(successResults);
      }

      async.parallel(wrappedTasks, callback);
    }),

  asyncMap: (array, fn, onError) => {
    assert(array && fn && onError, 'missing parameters');
    const tasks = array.map((element) => async () => fn(element));

    return Utils.asyncParallel(tasks, onError);
  },

  request,

  isUuidV4: (id) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id),

  JSONStringifyCircular(object) {
    const cache = [];
    const str = JSON.stringify(
      object,
      function (key, value) {
        if (typeof value === 'object' && value !== null) {
          if (cache.indexOf(value) !== -1) {
            return;
          }
          cache.push(value);
        }
        return value;
      },
      2
    );

    return str;
  },
};

module.exports = Utils;
