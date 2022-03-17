const request = require('superagent');
const errors = require('./errors');
const priceRequester = {
    async fetchPrice(coinCode){
        try{
            const res = await request.get('https://api.coingecko.com/api/v3/coins/01coin')
            const currentPrice = res.body.market_data.current_price[coinCode]
            console.log("\n ----- coinCode: " + currentPrice + "\n")
            if(currentPrice){return currentPrice}
            errors.assertExposable(coin, 'Not_existed_price');
        }
        catch(err) {
            console.log("\n ---- FALIURE catch----- \n: " + err )
        };
    }
}
module.exports = priceRequester;
