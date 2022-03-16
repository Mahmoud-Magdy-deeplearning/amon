const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');

const Models = require('..');
const { toObject } = require('./staticMethods');

module.exports = function setModels(sequelize) {
  const modelsPath = path.resolve(__dirname, '..');
  fs.readdirSync(modelsPath)
    .filter((file) => file.indexOf('.') !== 0 && file !== 'index.js' && file.slice(-3) === '.js')
    .forEach((file) => {
      const model = require(path.join(modelsPath, file))(sequelize, Sequelize.DataTypes);
      Models[model.name] = model;
    });

  Object.keys(Models).forEach((modelName) => {
    Models[modelName].prototype.toObject = toObject;
  });
};
