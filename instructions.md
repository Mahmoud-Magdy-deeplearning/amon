# AMON Node Dev Test

The purpose of this test is to evaluate your experience on an existing project.<br/>
The main keys of the test are:

- **Clean code**
- **Well covered unit test**
- **Following the architecture and the code style**

## Repository App Test

Clone the repository [Amon NodeJS Test](https://github.com/amontech/amon-nodejs-test)

## Goal

The api microservice need to expose 2 endpoints

- **PUT** => /coin/createCoin
- **GET** => /coin/:coinCode // Example response `{name: ‘Bitcoin’, code: ‘BTC’, price: ‘42000.35’}`

The **GET** endpoint should also return the current price of the coin which needs to be fetched from [coingecko API](https://www.coingecko.com/en/api/documentation).

## Tasks

- Build a new **PUT** endpoint to save the new coin into the database.
  If the coin already exists it should throw an error.
  The property "code" of the coin model should be unique.

- Create a helper to fetch the current price from [coingecko API](https://www.coingecko.com/en/api/documentation)
  the method we are interested in is (https://api.coingecko.com/api/v3/coins/:id)
  On the existing endpoint **getCoinByCode** needs to expose the current price. The final result should be as from the example
  `{name: ‘Bitcoin’, code: ‘BTC’, price: ‘42000.35’}`

- To avoid get rate limited from CoinGecko store the price and the last updated time and only fetch the price again
  if the last updated time is older than 1hour

- Write the migration file

- Test your code

- Make sure to pass the circleci tests

## Delivery

send the repository of your test

## Credits

Good luck :)

Amon Dev Team
