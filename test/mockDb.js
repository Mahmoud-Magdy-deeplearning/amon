const Sequelize = require('sequelize');
const DB = require('../src/modules/db');
const setModels = require('../src/models/pg/utils/setModels');

DB.sequelize = new Sequelize({
  dialect: 'sqlite',
  logging: console.log.bind(console, 'sequelize:'),
});
setModels(DB.sequelize);
