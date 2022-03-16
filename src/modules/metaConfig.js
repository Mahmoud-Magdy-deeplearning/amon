const assert = require('assert');
const Models = require('../models/pg');
const config = require('../../config');

const MetaConfig = {
  configSource: {},
  configKey: 'Config',
  configChannel: 'Config',

  updateConfig() {
    config.updateConfig(MetaConfig.configSource);
  },

  async reload() {
    MetaConfig.loadFromEnv(true);
    await MetaConfig.loadFromDb();
  },

  loadFromEnv(clean = false) {
    MetaConfig.configSource = Object.assign(clean ? {} : MetaConfig.configSource, process.env);
    MetaConfig.updateConfig();
  },

  async loadFromDb(clean = false) {
    const metaConf = await Models.Meta.getMeta(MetaConfig.configKey);
    const dbConfig = metaConf ? metaConf.getAllValues() : {};

    Object.keys(dbConfig).forEach((key) => assert(typeof dbConfig[key] === 'string', 'source config not string'));

    MetaConfig.configSource = Object.assign(clean ? {} : MetaConfig.configSource, dbConfig);
    MetaConfig.updateConfig();
  },

  async setInDb(key, value = null) {
    assert(typeof key === 'string', 'key must be a string');

    const metaConf = await Models.Meta.createOrGetMeta(MetaConfig.configKey);

    await metaConf.setValue(key, value);

    if (value) {
      MetaConfig.configSource[key] = value;
    } else {
      delete MetaConfig.configSource[key];
    }

    MetaConfig.updateConfig();
  },
};

module.exports = MetaConfig;
