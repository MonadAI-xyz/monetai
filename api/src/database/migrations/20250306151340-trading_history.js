'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('trading_history', {
      id: {
        type: Sequelize.UUID,
        defaultValue: queryInterface.sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      pair: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      action: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      token_in: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      token_out: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      amount_in: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      expected_amount_out: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      tx_hash: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      error: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: true,
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
      decision_id: {
        type: Sequelize.UUID,
        references: {
          model: 'decision_history',
          key: 'id',
        },
        onDelete: 'SET NULL',
        allowNull: true,
      },
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('trading_logs');
  },
};
