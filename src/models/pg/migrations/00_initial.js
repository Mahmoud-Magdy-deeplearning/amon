module.exports = {
  up: async function (query, transaction) {
    const sql = `
      CREATE TABLE "Coin" (
        id uuid NOT NULL,
        "createdAt" timestamp with time zone NOT NULL,
        "updatedAt" timestamp with time zone NOT NULL,
        "name" VARCHAR(255),
        "code" VARCHAR(255)
      );
    `;
    await transaction.sequelize.query(sql, { raw: true, transaction });
  },

  down: async function (query, transaction) {
    const sql = 'DROP TABLE "Coin"';
    await transaction.sequelize.query(sql, { raw: true, transaction });
  },
};
