'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('decision_history', {
      id: {
        type: Sequelize.UUID,
        defaultValue: queryInterface.sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      decision: {
        type: Sequelize.JSONB, // You can use JSON or JSONB, depending on your use case
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
        defaultValue: queryInterface.sequelize.literal('NOW()'),
      },
      updated_at: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
        defaultValue: queryInterface.sequelize.literal('NOW()'),
      },
    });
  },

  down: async (queryInterface, _Sequelize) => {
    await queryInterface.dropTable('decision_history');
  },
};
