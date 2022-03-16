const path = require('path');
const Connections = require(path.join(srcDir, 'modules/connections'));

// eslint-disable-next-line mocha/no-top-level-hooks
before(async () => {
  await Connections.open(['postgre']);
});

// eslint-disable-next-line mocha/no-top-level-hooks
after(async () => {
  await Connections.close();
});
