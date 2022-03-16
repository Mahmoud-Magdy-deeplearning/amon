const path = require('path');
const sinon = require('sinon');
const koa = require('koa');
const supertest = require('supertest');

const config = require(path.join(srcDir, '../config'));
const MainMiddleware = require(path.join(srcDir, '/services/api/middlewares'));

describe('Middleware: Main', () => {
  let sandbox = null;

  beforeEach(async () => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox && sandbox.restore();
  });

  // TODO test the rest

  it('Should install main middleware', async () => {
    const app = new koa();
    app.use(MainMiddleware());
  });

  it('Should allow all origins', async () => {
    config.SERVICES.API.CORS = [];
    const app = new koa();
    app.use(MainMiddleware());

    const server = app.listen();
    const request = supertest(server);

    const res = await request.get('/').set('Origin', 'google.com');

    expect(res.headers['vary']).to.eq('Origin');
    expect(res.headers['access-control-allow-origin']).to.eq('google.com');

    server.close();
  });
});
