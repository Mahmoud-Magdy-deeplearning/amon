const Joi = require('joi');
const Router = require('@koa/router');
const CoinController = require('../controllers/coin');
const { validateParams } = require('../../../helpers/validation');

const CoinRouter = {
  schemaGetByCoinCode: Joi.object({
    coinCode: Joi.string().min(3).uppercase().max(5),
  }),
  schemaCreateCoin: Joi.object({
    coinCode: Joi.string().min(3).uppercase().max(5).required(),
    name: Joi.string().min(2).max(20).required(),
  }),

  async getCoinByCode(ctx) {

    const params = {
      coinCode: ctx.params.coinCode,
    };
    console.log('ctx-body: '+ ctx.request.body.coinCode + '\n params: ' + params +'\n')


    const formattedParams = await validateParams(CoinRouter.schemaGetByCoinCode, params);

    ctx.body = await CoinController.getCoinByCode(formattedParams.coinCode);
  },
  
  async putCoin(ctx) {
    const params = {
      coinCode: ctx.request.body.coinCode,
      name: ctx.request.body.name
    };
    
    const formattedParams = await validateParams(CoinRouter.schemaCreateCoin, params);

    ctx.body = await CoinController.createCoin(formattedParams.name, formattedParams.coinCode);
  },

  router() {
    const router = Router();

    /**
     * @api {get} / Get coinCode
     * @apiName coinCode
     * @apiGroup Status
     * @apiDescription Get coinCode
     *
     * @apiSampleRequest /
     *
     */

    router.get('/:coinCode', CoinRouter.getCoinByCode);

    /**
     * @api {put} / Put coinCode
     * @apiName createCoin
     * @apiGroup Status
     * @apiDescription Put coinCode
     *
     * @apiSampleRequest /
     *
     */
     router.put('/createCoin', CoinRouter.putCoin);

    return router;
  },
};

module.exports = CoinRouter;
