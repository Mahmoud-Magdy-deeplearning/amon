module.exports = function (sequelize, DataTypes) {
  const Meta = sequelize.define(
    'Meta',
    {
      key: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      data: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      validation: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
    },
    {
      freezeTableName: true,
    }
  );

  Meta.getMeta = async function (key) {
    return await Meta.findOne({ where: { key } });
  };

  Meta.createMeta = async function (key, data) {
    return await Meta.create({
      key,
      data,
    });
  };
  Meta.createOrGetMeta = async function (key) {
    return (await Meta.getMeta(key)) || (await Meta.createMeta(key, {}));
  };

  Meta.prototype.getValue = function (key) {
    return this.data[key];
  };

  Meta.prototype.getAllValues = function () {
    return this.data;
  };

  Meta.prototype.setValue = async function (key, value = null) {
    if (value) {
      this.data[key] = value;
    } else {
      delete this.data[key];
    }

    this.changed('data', true);

    await this.save();
  };

  return Meta;
};
