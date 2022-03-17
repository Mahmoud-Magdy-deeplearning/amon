const { v4: uuid } = require('uuid');
const { pick } = require('lodash');

module.exports = function (sequelize, DataTypes) {
  const Coin = sequelize.define(
    'Coin',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: () => uuid(),
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      price: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
    },
    {
      freezeTableName: true,
      timestamps: true,
    }
  );


  Coin.prototype.filterKeys = function (price=false) {

    const obj = this.toObject();
    if(price){
    return pick(obj, 'id', 'name', 'code', 'price');
    }
    else {
    return pick(obj, 'id', 'name', 'code');
    }
  };

  Coin.findByCoinCode = function (code, tOpts = {}) {
    
    return Coin.findOne(Object.assign({ where: { code } }, tOpts));
  };
  
  Coin.updatePrice = async function (code, price) {
      return Coin.update({price}, { where: { code } });
  };

  Coin.createCoin = async function (code, name) {
    // Check if the code of coin exist in DB
    if(!await Coin.findByCoinCode(code))
      return Coin.create({
        name: name,
        code: code
      });
  else 
      return null
    };

  return Coin;
};
