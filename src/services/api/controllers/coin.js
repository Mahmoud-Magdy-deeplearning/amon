const errors = require('../../../helpers/errors');
const priceRequester = require('../../../helpers/priceRequester');
const Models = require('../../../models/pg');
const lastTimeUpdated = require('../../../helpers/lastTimeUpdated')

const CoinController = {
  async getCoinByCode(coinCode) {
    const coin = await Models.Coin.findByCoinCode(coinCode);
    errors.assertExposable(coin, 'unknown_coin_code');
    
    // Fetching current price from API if lastt update > 1 Hour 
    const diff = lastTimeUpdated(coin.updatedAt)
    if( diff >= 3600 || coin.price == null){
      const price = await priceRequester.fetchPrice(coinCode.toLowerCase())
      await Models.Coin.updatePrice(coinCode, price);
    }

    return coin.filterKeys(true);
  },
  async createCoin(name, coinCode) {
    const coin = await Models.Coin.createCoin(coinCode, name);
    errors.assertExposable(coin, 'coinCode_is_exist');

    return coin.filterKeys();
  },
};

module.exports = CoinController;
