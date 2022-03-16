const path = require('path');
const sinon = require('sinon');

const DB = require(path.join(srcDir, '/modules/db'));

describe('DB', () => {
  let sandbox = null;

  beforeEach(async () => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox && sandbox.restore();
  });

  it('Should error concurrent', () => {
    const errUpdate = new Error('could not serialize access due to concurrent update');
    expect(DB.isErrorConcurrent(errUpdate)).to.be.true;
    const errDelete = new Error('could not serialize access due to concurrent delete');
    expect(DB.isErrorConcurrent(errDelete)).to.be.true;
  });

  it('Cannot error concurrent if is not', () => {
    const err = new Error('could not serialize');

    expect(DB.isErrorConcurrent(err)).to.be.false;
  });

  it('get transaction options', async () => {
    const tOpts = await DB.transactionOptions();
    expect(tOpts.transaction.id).to.exist;
    await tOpts.transaction.rollback();
  });

  describe('isAlreadyCommited', () => {
    it('Should be already commited', async () => {
      const error = { message: 'Transaction cannot be rolled back because it has been finished with state: commit' };
      expect(DB.isAlreadyCommited(error)).to.be.true;
    });
    it('Should not be already commited', async () => {
      const error = { message: null };
      expect(DB.isAlreadyCommited(error)).to.be.false;
    });
  });

  describe('retry tx', () => {
    beforeEach(() => {
      this.rollback = sinon.stub().resolves();
      sandbox.stub(DB, 'transactionOptions').returns({
        transaction: {
          rollback: this.rollback,
          finished: null,
        },
      });
    });

    it('retry transaction error concurrent', async () => {
      let i = 0;
      async function fn(tOpts) {
        expect(tOpts.transaction).to.exist;
        if (i === 0 || i === 1) {
          i++;
          throw new Error('could not serialize access due to concurrent update');
        }
        return 'ok';
      }

      const res = await DB.executeTxFn(fn);

      expect(res).to.eq('ok');
      expect(this.rollback.callCount).to.eq(2);
    });

    it('retry transaction error readwrite', async () => {
      let i = 0;
      async function fn(tOpts) {
        expect(tOpts.transaction).to.exist;
        i++;
        if (i === 1) {
          throw new Error('could not serialize access due to read/write dependencies among transactions');
        }
        return 'ok';
      }

      const res = await DB.executeTxFn(fn);

      expect(res).to.eq('ok');
      expect(this.rollback.callCount).to.eq(1);
      expect(i).to.eq(2);
    });

    it('retry if already commited after rollback', async () => {
      this.rollback.rejects(
        new Error('Transaction cannot be rolled back because it has been finished with state: commit')
      );
      let i = 0;
      async function fn() {
        i++;
        if (i === 1) {
          throw new Error('could not serialize access due to read/write dependencies among transactions');
        }
        return 'ok';
      }

      const res = await DB.executeTxFn(fn);

      expect(res).to.eq('ok');
      expect(this.rollback.callCount).to.eq(1);
      expect(i).to.eq(2);
    });

    it('retry transaction error rollback error', async () => {
      DB.transactionOptions.restore();
      this.rollback = sinon.stub().resolves();
      sandbox.stub(DB, 'transactionOptions').returns({
        transaction: {
          rollback: this.rollback,
        },
      });

      let i = 0;
      async function fn() {
        i++;
        if (i === 1 || i === 2) {
          throw new Error('could not serialize access due to concurrent update');
        } else if (i === 3) {
          throw new Error('could not serialize access due to read/write dependencies among transactions');
        }
        return 'ok';
      }

      const res = await DB.executeTxFn(fn);

      expect(res).to.eq('ok');
      expect(this.rollback.callCount).to.eq(3);
      expect(i).to.eq(4);
    });

    it('Transaction error already rollback error', async () => {
      DB.transactionOptions.restore();
      this.rollback = sinon.stub().resolves();
      sandbox.stub(DB, 'transactionOptions').returns({
        transaction: {
          rollback: this.rollback,
          finished: 'rollback',
        },
      });

      async function fn() {
        throw new Error('something');
      }

      await expect(DB.executeTxFn(fn)).to.be.rejectedWith(Error, 'something');

      expect(this.rollback.callCount).to.eq(0);
    });

    it('retry transaction error always concurrent', async () => {
      async function fn() {
        throw new Error('could not serialize access due to concurrent update');
      }

      await expect(DB.executeTxFn(fn)).to.be.rejectedWith(Error, 'sql_concurrent');
    });

    it('works first', async () => {
      async function fn() {
        return 'ok';
      }

      const res = await DB.executeTxFn(fn);

      expect(res).to.eq('ok');
      expect(this.rollback.callCount).to.eq(0);
    });

    it('other error', async () => {
      let i = 0;
      async function fn() {
        if (i === 0 || i === 1) {
          i++;
          throw new Error('could not serialize access due to concurrent update');
        }
        throw new Error('something');
      }

      await expect(DB.executeTxFn(fn)).to.be.rejectedWith(Error, 'something');
    });
  });
});
