const path = require('path');
const sinon = require('sinon');
const logger = require(path.join(srcDir, '/modules/logger'));
const DB = require(path.join(srcDir, 'modules/db'));
const Connections = require(path.join(srcDir, '/modules/connections'));

describe('Module: connection', () => {
  let sandbox = null;

  beforeEach(async () => {
    sandbox = sinon.createSandbox();

    this.stubDBConnect = sandbox.stub(DB, 'connect');
    this.stubDBDisconnect = sandbox.stub(DB, 'disconnect');
  });

  afterEach(() => {
    Connections.openedConnections = [];
    sandbox && sandbox.restore();
  });

  describe('Open', () => {
    it('Should open db', async () => {
      const stubLogger = sandbox.stub(logger, 'verbose');
      const res = await Connections.open(['postgre']);

      expect(res).to.be.true;
      expect(this.stubDBConnect.calledOnce).to.be.true;
      expect(stubLogger.calledOnce).to.be.true;
      expect(stubLogger.calledWith('Connections open')).to.be.true;
    });

    it('Should open all', async () => {
      const stubLogger = sandbox.stub(logger, 'verbose');
      const res = await Connections.open(['postgre']);

      expect(res).to.be.true;
      expect(this.stubDBConnect.calledOnce).to.be.true;
      expect(stubLogger.calledOnce).to.be.true;
      expect(stubLogger.calledWith('Connections open')).to.be.true;
    });

    it('Should throw when unknown connection', async () => {
      const stubLogger = sandbox.stub(logger, 'warn');
      await expect(Connections.open(['unknown'])).to.be.rejectedWith(Error, 'Unknown service to connect to');
      expect(stubLogger.calledOnce).to.be.true;
      expect(stubLogger.calledWith('Unable to open connections')).to.be.true;
      expect(Connections.openedConnections).to.be.deep.eq([]);
    });

    it('Should throw on error', async () => {
      const stubLogger = sandbox.stub(logger, 'warn');
      this.stubDBConnect.rejects(new Error('fake-error'));

      await expect(Connections.open(['postgre'])).to.be.rejectedWith(Error, 'fake-error');
      expect(stubLogger.calledOnce).to.be.true;
      expect(stubLogger.calledWith('Unable to open connections')).to.be.true;
      expect(Connections.openedConnections).to.be.deep.eq([]);
    });

    it('Should open check already open', async () => {
      const res = await Connections.open(['postgre']);

      expect(res).to.be.true;
      expect(this.stubDBConnect.calledOnce).to.be.true;

      const res1 = await Connections.open(['postgre']);
      expect(res1).to.be.true;
      expect(this.stubDBConnect.calledOnce).to.be.true;
    });
  });

  describe('Close', () => {
    it('Should close any open', async () => {
      const stubLogger = sandbox.stub(logger, 'verbose');
      const stubLoggerPurge = sandbox.stub(logger, 'purge');

      await Connections.close();

      expect(this.stubDBDisconnect.callCount).to.be.eq(0);

      expect(stubLogger.calledOnce).to.be.true;
      expect(stubLogger.calledWith('Connections closed')).to.be.true;
      expect(stubLoggerPurge.calledOnce).to.be.true;
      expect(Connections.openedConnections).to.be.deep.eq([]);
    });

    it('Should close all', async () => {
      const stubLogger = sandbox.stub(logger, 'verbose');
      const stubLoggerPurge = sandbox.stub(logger, 'purge');
      Connections.openedConnections = ['postgre'];

      await Connections.close();

      expect(this.stubDBDisconnect.calledOnce).to.be.true;

      expect(stubLogger.calledOnce).to.be.true;
      expect(stubLogger.calledWith('Connections closed')).to.be.true;
      expect(stubLoggerPurge.calledOnce).to.be.true;
      expect(Connections.openedConnections).to.be.deep.eq([]);
    });

    it('Should throw to close unknown connection', async () => {
      Connections.openedConnections = ['unknown'];
      const stubLogger = sandbox.stub(logger, 'error');
      await expect(Connections.close()).to.be.rejectedWith(Error, 'Unknown service to disconnect from');
      expect(stubLogger.calledOnce).to.be.true;
      expect(stubLogger.calledWith('Unable to close connections')).to.be.true;
    });
  });
});
