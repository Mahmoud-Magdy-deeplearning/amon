const errors = require('../../../helpers/errors');
const requester = require('../../../helpers/requester');
const Models = require('../../../models/pg');

const CoinController = {
  async getCoinByCode(coinCode) {
    const coin = await Models.Coin.findByCoinCode(coinCode);
    console.log('\n coin is: '+ coin.name + '\n')
    errors.assertExposable(coin, 'unknown_coin_code');
    const price = await requester.fetchPrice(coin.coinCode)
    return coin.filterKeys(true);
  },
  async createCoin(name, coinCode) {
    const coin = await Models.Coin.createCoin(coinCode, name);

    errors.assertExposable(coin, 'coinCode_is_exist');

    return coin.filterKeys();
  },
  async updatePrice(coinCode,price) {
    const coin = await Models.Coin.updatePrice(coinCode, price);
  },
};

module.exports = CoinController;
