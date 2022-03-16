module.exports = {
  toObject: function () {
    const obj = this.get({
      plain: true,
    });

    return Object.keys(obj).reduce((acc, key) => {
      if (obj[key] !== undefined && obj[key] !== null) {
        acc[key] = obj[key];
      }

      return acc;
    }, {});
  },
};
