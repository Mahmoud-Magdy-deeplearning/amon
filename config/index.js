require('dotenv').config();
const Decimal = require('decimal.js');
Decimal.set({ precision: 1e3 });

const { assignIn } = require('lodash');
const commonConfig = require('./common');

const CONFIG = {
  updateConfig(sourceConfig) {
    const newConfig = commonConfig.getConfigObject(sourceConfig);
    assignIn(CONFIG, newConfig);
  },
};

CONFIG.updateConfig(process.env);

module.exports = CONFIG;
