'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Users Table sample
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: queryInterface.sequelize.literal('gen_random_uuid()'),
      },
      wallet_address: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        unique: true,
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

  down: async queryInterface => {
    await queryInterface.dropTable('users');
  },
};
