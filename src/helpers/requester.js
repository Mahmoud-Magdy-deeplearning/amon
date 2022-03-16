const request = require('superagent');
const errors = require('./errors');
const requester = {
    fetchPrice(coinCode){
        request
        .get('https://api.coingecko.com/api/v3/coins/01coin')
        .then(res => {
            console.log("\n 😎RES IS:😎: " + res.body.market_data.current_price.coinCode + "\n")
            return res.body.market_data.current_price.coinCode
        })
        .catch(err => {
            errors.assertExposable(coin, 'Not_existed_price');

        });
    }
}
module.exports = requester;
