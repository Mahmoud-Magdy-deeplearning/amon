const path = require('path');
const sinon = require('sinon');
const moment = require('moment');
const sequelizeMockingMocha = require('sequelize-mocking').sequelizeMockingMocha;
const request = require('request-promise');

const logger = require(path.join(srcDir, '/modules/logger'));
const Utils = require(path.join(srcDir, '/helpers/utils'));
const DB = require(path.join(srcDir, '/modules/db'));

describe('Helpers: Utils', () => {
  let sandbox = null;

  sequelizeMockingMocha(DB.sequelize, [], { logging: false });

  beforeEach(async () => {
    sandbox = sinon.createSandbox();
  });

  afterEach(async () => {
    sandbox && sandbox.restore();
  });

  it('Should noop', () => {
    expect(Utils.noop()).to.eq(0);
  });

  it('Should wait', (done) => {
    let end = false;

    Utils.wait(500)
      .then(() => {
        end = true;
        return true;
      })
      .catch((error) => console.error(error));

    setTimeout(() => {
      if (end) {
        done('too early');
      }
    }, 300);
    setTimeout(() => {
      if (end) {
        done();
      } else {
        done('too late');
      }
    }, 600);
  });

  it('setImmediateAsync', async () => {
    let rs = false;
    let th = false;

    const error = new Error('er');
    const logerror = sandbox.stub(logger, 'error');

    const fnResolve = async () => {
      await Utils.wait(100);
      rs = true;
    };
    const fnThrow = async () => {
      await Utils.wait(100);
      th = true;
      throw error;
    };

    Utils.setImmediateAsync(fnResolve);
    Utils.setImmediateAsync(fnThrow);

    expect(rs).to.be.false;
    expect(th).to.be.false;

    await Utils.wait(110);

    expect(rs).to.be.true;
    expect(th).to.be.true;

    expect(logerror.args[0][0]).to.eq(error.message);
    expect(logerror.args[0][1].error).to.eq(error);
  });

  it('enum to object', () => {
    const en = ['a', 'b', 'c'];

    const obj = Utils.enumToObject(en);

    expect(Object.keys(obj).length).to.eq(3);
    expect(obj['a']).to.eq('a');
    expect(obj['b']).to.eq('b');
    expect(obj['c']).to.eq('c');
  });

  describe('Get Range between dates', () => {
    it('get range by days', () => {
      const startDate = moment().format();
      const endDate = moment().add(2, 'days').format();

      const dates = Utils.getDateRange(startDate, endDate);

      expect(dates.length).to.eq(3);
    });

    it('get range by hours', () => {
      const startDate = moment().format();
      const endDate = moment().add(2, 'hours').format();

      const dates = Utils.getDateRange(startDate, endDate, 'hours');

      expect(dates.length).to.eq(3);
    });
  });

  describe('setIntervalAsync', () => {
    it('repeats', async () => {
      const onError = sinon.stub();
      const fn = sinon.stub().resolves(Utils.wait(50));
      const delay = 200;

      const clear = Utils.setIntervalAsync(fn, delay, onError);

      await Utils.wait(100);
      expect(fn.args.length).to.eq(1);

      await Utils.wait(200);
      expect(fn.args.length).to.eq(2);

      await Utils.wait(300);
      expect(fn.args.length).to.eq(3);

      clear();

      await Utils.wait(300);
      expect(fn.args.length).to.eq(3);
    });

    it('stops while working', async () => {
      const onError = sinon.stub();
      const fn = sinon.stub().resolves(Utils.wait(500));
      const delay = 100;

      const clear = Utils.setIntervalAsync(fn, delay, onError);

      await Utils.wait(100);
      expect(fn.args.length).to.eq(1);

      clear();

      await Utils.wait(600);
      expect(fn.args.length).to.eq(1);
    });

    it('clear waits execution end', async () => {
      const onError = sinon.stub();
      const fn = sinon.stub().resolves(Utils.wait(500));
      const delay = 100;

      const clear = Utils.setIntervalAsync(fn, delay, onError);
      await Utils.wait(10);
      expect(fn.args.length).to.eq(1);

      const d = Date.now();

      await clear(true);

      expect(Date.now() - d).to.be.greaterThan(400);
    });

    it('throws', async () => {
      const onError = sinon.stub();
      const e = new Error('pascontent');
      const fn = sinon.stub().resolves(Utils.wait(100));
      const delay = 500;

      const clear = Utils.setIntervalAsync(fn, delay, onError);

      await Utils.wait(200);
      expect(fn.args.length).to.eq(1);

      fn.rejects(e);
      expect(onError.calledOnce).to.be.false;

      await Utils.wait(500);

      expect(fn.args.length).to.eq(2);
      expect(onError.calledOnce).to.be.true;
      expect(onError.args[0][0]).to.eq(e);

      clear();
    });

    it('throws but still continues', async () => {
      const onError = sinon.stub();
      const e = new Error('pascontent');
      const fn = sinon.stub().resolves(Utils.wait(50));
      const delay = 400;

      const clear = Utils.setIntervalAsync(fn, delay, onError);

      await Utils.wait(200);
      expect(fn.args.length).to.eq(1);

      fn.rejects(e);
      expect(onError.calledOnce).to.be.false;

      await Utils.wait(500);

      expect(fn.args.length).to.eq(2);
      expect(onError.calledOnce).to.be.true;
      expect(onError.args[0][0]).to.eq(e);

      await Utils.wait(500);
      expect(fn.args.length).to.eq(3);

      clear();
    });

    it('throws with default error handler', async () => {
      const error = sandbox.stub(logger, 'error');

      const e = new Error('pascontent');
      const fn = sinon.stub().resolves(Utils.wait(100));
      const delay = 500;

      const clear = Utils.setIntervalAsync(fn, delay);

      await Utils.wait(200);
      expect(fn.args.length).to.eq(1);

      fn.rejects(e);
      expect(error.calledOnce).to.be.false;

      await Utils.wait(500);

      clear();

      expect(fn.args.length).to.eq(2);
      expect(error.calledOnce).to.be.true;
      expect(error.args[0][0]).to.eq('pascontent');
      expect(error.args[0][1].error).to.eq(e);
    });
  });

  it('Should rate limit', async () => {
    const stub = sinon.stub().returns(Promise.resolve());
    const limiter = Utils.rateLimit(2, 1000, stub);
    Promise.all([limiter(1), limiter(2), limiter(3), limiter(4)]).catch((error) => console.error(error));

    expect(stub.callCount).to.eq(2);

    await Utils.wait(1000);

    expect(stub.callCount).to.eq(4);
  });

  it('Should generate random digits', () => {
    const digits = Utils.randomDigits();
    expect(typeof digits).to.be.eq('string');
    expect(digits.length).to.be.eq(6);
  });

  it('Should generate random digits specific length', () => {
    const digits = Utils.randomDigits(12);
    expect(typeof digits).eq('string');
    expect(digits.length).eq(12);
  });

  it('Should get default error', () => {
    Utils.defaultError(new Error('test-err'));
  });

  describe('chunkPeriod', () => {
    it('Should chunk time without size', () => {
      const start = moment.utc().startOf('minutes');
      const end = start.clone().add('10', 'minutes');

      const chunkDates = Utils.chunkPeriod(start, end);

      expect(chunkDates.length).to.eq(10);
    });

    it('Should chunk time with size', () => {
      const start = moment.utc().startOf('minutes');
      const end = start.clone().add('30', 'minutes');
      const chunkDates = Utils.chunkPeriod(start, end, 'minutes', 10);

      expect(chunkDates.length).to.eq(3);
    });

    it('Should chunk only one', () => {
      const start = moment.utc().startOf('minutes');
      const end = start.clone().add('10', 'minutes');
      const chunkDates = Utils.chunkPeriod(start, end, 'minutes', 10);

      expect(chunkDates.length).to.eq(1);
    });
  });

  it('Should remove empty strings', async () => {
    const data = {
      a: 'a',
      b: 'b',
      c: '',
      d: undefined,
    };

    const clean = Utils.removeEmptyStrings(data);
    expect(clean).to.have.property('a', 'a');
    expect(clean).to.have.property('b', 'b');
    expect(clean).not.to.have.property('c');
    expect(clean).not.to.have.property('d');
  });

  it('isTrue', async () => {
    expect(Utils.isTrue(true)).to.be.true;
    expect(Utils.isTrue('true')).to.be.true;

    expect(Utils.isTrue('fezf')).to.be.false;
    expect(Utils.isTrue('false')).to.be.false;
    expect(Utils.isTrue('fdsqgqdsg')).to.be.false;
    expect(Utils.isTrue(false)).to.be.false;
  });

  it('sortByDate', async () => {
    const arr = [
      { id: 0, p: moment('2017-11-10T22:44:53Z').format() },
      { id: 1, p: moment('2017-11-01T22:44:53Z').format() },
      { id: 2, p: moment('2017-11-03T22:44:53Z').format() },
      { id: 3, p: moment('2017-11-12T22:44:53Z').format() },
      { id: 4, p: moment('2017-11-04T22:44:53Z').format() },
    ];

    const asc = arr.sort(Utils.sortByDate('p', 'asc'));

    expect(asc[0].id).to.eq(1);
    expect(asc[1].id).to.eq(2);
    expect(asc[2].id).to.eq(4);
    expect(asc[3].id).to.eq(0);
    expect(asc[4].id).to.eq(3);

    const desc = arr.sort(Utils.sortByDate('p', 'desc'));
    expect(desc[0].id).to.eq(3);
    expect(desc[1].id).to.eq(0);
    expect(desc[2].id).to.eq(4);
    expect(desc[3].id).to.eq(2);
    expect(desc[4].id).to.eq(1);

    expect(() => arr.sort(Utils.sortByDate('p', 'invalid'))).to.be.throw(Error, 'invalid order');
  });

  it('configParser', () => {
    const configSource = {
      string: 'coucou',
      array: 'coucou,caca',
      boolt: 'true',
      boolf: 'false',
      boolu: 'f',
      integer: 12,
      decimal: 12.12,
    };
    expect(Utils.configParser(configSource, 'string', 'string')).to.eq('coucou');
    expect(Utils.configParser(configSource, 'string', 'string', 'def')).to.eq('coucou');
    expect(Utils.configParser(configSource, 'string', 'array')).to.eq('coucou,caca');
    expect(Utils.configParser(configSource, 'string', 'unknown')).to.eq('');
    expect(Utils.configParser(configSource, 'string', 'unknown', 'def')).to.eq('def');

    expect(Utils.configParser(configSource, 'array', 'array')).to.deep.eq(['coucou', 'caca']);
    expect(Utils.configParser(configSource, 'array', 'array', ['def'])).to.deep.eq(['coucou', 'caca']);
    expect(Utils.configParser(configSource, 'array', 'string')).to.deep.eq(['coucou']);
    expect(Utils.configParser(configSource, 'array', 'unknown')).to.deep.eq([]);
    expect(Utils.configParser(configSource, 'array', 'unknown', ['def'])).to.deep.eq(['def']);

    expect(Utils.configParser(configSource, 'bool', 'boolt')).to.be.true;
    expect(Utils.configParser(configSource, 'bool', 'boolt', false)).to.be.true;
    expect(Utils.configParser(configSource, 'bool', 'boolf')).to.be.false;
    expect(Utils.configParser(configSource, 'bool', 'boolu')).to.be.false;
    expect(Utils.configParser(configSource, 'bool', 'boolunnn')).to.be.false;
    expect(Utils.configParser(configSource, 'bool', 'boolunnn', true)).to.be.true;

    expect(Utils.configParser(configSource, 'number', 'integer')).to.eq(12);
    expect(Utils.configParser(configSource, 'number', 'decimal')).to.eq(12.12);
    expect(Utils.configParser(configSource, 'number', 'unkn')).to.eq(0);
    expect(Utils.configParser(configSource, 'number', 'unkn', 2)).to.eq(2);

    expect(() => Utils.configParser(configSource, 'unk', 'string')).to.throw();
  });

  it('asyncForEach', async () => {
    let i = 0;
    let done = false;
    const arr = [0, 1, 2, 3];

    async function fn(obj, index, array) {
      expect(obj).to.eq(i);
      expect(index).to.eq(i);
      expect(array).to.eq(arr);
      i++;
      if (i === 3) done = true;
    }

    await Utils.asyncForEach(arr, fn);

    expect(done).to.be.true;
  });

  it('Should asyncForEach and break on false', async () => {
    const stubFn = sandbox.stub().callsFake(async (item, i) => {
      if (i === 1) {
        return false;
      }

      return true;
    });

    await Utils.asyncForEach([0, 1, 2, 3], stubFn, true);
    expect(stubFn.callCount).to.be.eq(2);
  });

  it('asyncParralel', async () => {
    const tasks = [
      async () => {
        await Utils.wait(100);
        return 1;
      },
      async () => {
        await Utils.wait(100);
        return 2;
      },
      async () => {
        await Utils.wait(100);
        throw new Error('1');
      },
      async () => {
        await Utils.wait(100);
        throw new Error('2');
      },
    ];

    const onError = sandbox.stub();
    const t1 = Date.now();

    const res = await Utils.asyncParallel(tasks, onError);

    const time = Date.now() - t1;

    expect(time >= 100).to.be.true;

    expect(res[0]).to.eq(1);
    expect(res[1]).to.eq(2);
    expect(onError.args[0][0].message).to.eq('1');
    expect(onError.args[1][0].message).to.eq('2');
  });

  it('asyncMap', async () => {
    const array = [100, 200, 20001, 20002];

    async function fn(time) {
      if (time > 2000) throw new Error(time.toString());
      await Utils.wait(200);
      return time;
    }

    const onError = sandbox.stub();
    const t1 = Date.now();

    const res = await Utils.asyncMap(array, fn, onError);

    const time = Date.now() - t1;

    expect(time > 100).to.be.true;

    expect(res[0]).to.eq(100);
    expect(res[1]).to.eq(200);
    expect(onError.args[0][0].message).to.eq('20001');
    expect(onError.args[1][0].message).to.eq('20002');
  });

  it('asyncMap should throw error missing param', async () => {
    const array = [100, 200];

    async function fn(time) {
      await Utils.wait(100);
      return time;
    }

    try {
      await Utils.asyncMap(array, fn);
    } catch (e) {
      expect(e.message).to.be.eq('missing parameters');
    }
  });

  it('request', () => {
    expect(Utils.request).to.be.eq(request);
  });

  it('Should find uuidV4', () => {
    expect(Utils.isUuidV4('a')).to.be.false;
    expect(Utils.isUuidV4()).to.be.false;
    expect(Utils.isUuidV4(false)).to.be.false;
    expect(Utils.isUuidV4('55de60fa-f16b-4348-85ce-ce03305d4cd3')).to.be.true;
  });

  it('Should parse json circular', () => {
    const child = {};
    const obj = { a: 1, child };
    child.obj = obj;
    expect(Utils.JSONStringifyCircular(obj)).to.be.eq('{\n  "a": 1,\n  "child": {}\n}');
  });
});
