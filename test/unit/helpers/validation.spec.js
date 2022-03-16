const path = require('path');
const Joi = require('joi');
const Validation = require(path.join(srcDir, '/helpers/validation'));

describe('Helpers: Validation', () => {
  describe('Custom schema', () => {
    it('uuid', async () => {
      const uuid = '26a05507-0395-447a-aaaa-000000000000';

      const res = await Validation.schemas.uuid.validateAsync(uuid);
      expect(res).to.be.eq(uuid);

      await expect(Validation.schemas.uuid.validateAsync('26a05507-0395-447a-aaaa-00000000000')).to.be.rejectedWith(
        Error,
        '"value" must be a valid GUID'
      );
    });

    it('email', async () => {
      const res = await Validation.schemas.email.validateAsync('user@email.com');
      expect(res).to.be.eq('user@email.com');

      const res1 = await Validation.schemas.email.validateAsync('user@email.com ');
      expect(res1).to.be.eq('user@email.com');

      const res2 = await Validation.schemas.email.validateAsync('uSEr@emAil.com');
      expect(res2).to.be.eq('user@email.com');

      await expect(Validation.schemas.email.validateAsync('a')).to.be.rejectedWith(
        Error,
        '"value" must be a valid email'
      );

      await expect(
        Validation.schemas.email.validateAsync(
          '0f07830a403f530d3981e4719be64484bd05dd57b2a0b780e3de34069edd5c21@email.com'
        )
      ).to.be.rejectedWith(Error, '"value" length must be less than or equal to 64 characters long');
    });

    it('twoFaCode', async () => {
      const res = await Validation.schemas.twoFaCode.validateAsync('123456');
      expect(res).to.be.eq('123456');

      await expect(Validation.schemas.twoFaCode.validateAsync('12345')).to.be.rejectedWith(
        Error,
        '"value" length must be 6 characters long'
      );

      await expect(Validation.schemas.twoFaCode.validateAsync('1234567')).to.be.rejectedWith(
        Error,
        '"value" length must be 6 characters long'
      );
    });

    it('date', async () => {
      const res = await Validation.schemas.date.validateAsync('2019-12-19T15:05:00Z');
      expect(res.toISOString()).to.be.eq('2019-12-19T15:05:00.000Z');

      const res1 = await Validation.schemas.date.validateAsync('2019-12-19');
      expect(res1.toISOString()).to.be.eq('2019-12-19T00:00:00.000Z');

      await expect(Validation.schemas.date.validateAsync('2099-12-19T15:05:00Z')).to.be.rejectedWith(
        Error,
        '"value" must be less than "now"'
      );

      await expect(Validation.schemas.date.validateAsync('1099-12-19T15:05:00Z')).to.be.rejectedWith(
        Error,
        '"value" must be greater than "1974-01-01T00:00:00.001Z"'
      );
    });

    it('pagination', async () => {
      const res = await Validation.schemas.pagination.validateAsync({
        limit: 20,
        offset: 10,
        order: 'asc',
      });
      expect(res).to.be.deep.eq({
        limit: 20,
        offset: 10,
        order: 'asc',
      });

      const res1 = await Validation.schemas.pagination.validateAsync({});
      expect(res1).to.be.deep.eq({ limit: 10, offset: 0, order: 'desc' });
    });
  });

  describe('Validate schema', () => {
    it('Should validate params', async () => {
      const schema = Joi.object({
        num: Joi.number().integer(),
        str: Joi.string(),
      });

      const res = await Validation.validateParams(schema, {
        num: 1,
        str: 'str1',
      });

      expect(res.num).to.be.eq(1);
      expect(res.str).to.be.eq('str1');
    });

    it('Should validate params with custom schema', async () => {
      const schema = Joi.object({
        twoFaCode: Validation.schemas.twoFaCode,
      });

      const res = await Validation.validateParams(schema, {
        twoFaCode: '123456',
      });

      expect(res.twoFaCode).to.be.eq('123456');
    });

    it('Should validate params throw nice error', async () => {
      const schema = Joi.object({
        age: Joi.number(),
        date: Joi.date(),
      });
      const params = {
        date: 14,
        age: 'fsdqf',
      };

      let isThrowing = false;

      try {
        await Validation.validateParams(schema, params);
      } catch (error) {
        isThrowing = true;
        expect(error.message).to.be.eq('bad_params');
        expect(error.exposeMeta.validationError.params.date).to.be.eq(params.date);
        expect(error.exposeMeta.validationError.params.age).to.be.eq(params.age);
        expect(error.exposeMeta.validationError.errors.length).to.be.eq(1);
        expect(error.exposeMeta.validationError.errors[0]).to.be.eq('"age" must be a number');
      }

      expect(isThrowing).to.be.true;
    });

    it('Should validate params throw nice error remove password params value', async () => {
      const schema = Joi.object({
        age: Joi.number(),
        date: Joi.date(),
        password: Joi.string(),
      });
      const params = {
        date: 14,
        age: 'fsdqf',
        password: 'fsdqf',
      };

      let isThrowing = false;

      try {
        await Validation.validateParams(schema, params);
      } catch (error) {
        isThrowing = true;
        expect(error.message).to.be.eq('bad_params');
        expect(error.exposeMeta.validationError.params.date).to.be.eq(params.date);
        expect(error.exposeMeta.validationError.params.age).to.be.eq(params.age);
        expect(error.exposeMeta.validationError.params.password).not.to.exist;
        expect(error.exposeMeta.validationError.errors.length).to.be.eq(1);
        expect(error.exposeMeta.validationError.errors[0]).to.be.eq('"age" must be a number');
      }

      expect(isThrowing).to.be.true;
    });
  });
});
