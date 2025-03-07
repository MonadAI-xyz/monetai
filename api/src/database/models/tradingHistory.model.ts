import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { DecisionHistory, DecisionHistoryId } from '@models';
import db from '@database';

export interface TradingHistoryAttributes {
  id: string;
  timestamp: Date;
  pair: string;
  action: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  expectedAmountOut: string;
  txHash: string;
  status: string;
  error?: string;
  message?: string;
  createdAt?: Date;
  updatedAt?: Date;
  decisionId?: string;
}

export type TradingHistoryPk = 'id';
export type TradingHistoryId = TradingHistory[TradingHistoryPk];
export type TradingHistoryOptionalAttributes = 'id' | 'error' | 'message' | 'createdAt' | 'updatedAt' | 'decisionId';
export type TradingHistoryCreationAttributes = Optional<TradingHistoryAttributes, TradingHistoryOptionalAttributes>;

export class TradingHistory extends Model<TradingHistoryAttributes, TradingHistoryCreationAttributes> implements TradingHistoryAttributes {
  id!: string;
  timestamp!: Date;
  pair!: string;
  action!: string;
  tokenIn!: string;
  tokenOut!: string;
  amountIn!: string;
  expectedAmountOut!: string;
  txHash!: string;
  status!: string;
  error?: string;
  message?: string;
  createdAt!: Date;
  updatedAt!: Date;
  decisionId?: string;

  // TradingHistory belongsTo DecisionHistory via decisionId
  decision!: DecisionHistory;
  getDecision!: Sequelize.BelongsToGetAssociationMixin<DecisionHistory>;
  setDecision!: Sequelize.BelongsToSetAssociationMixin<DecisionHistory, DecisionHistoryId>;
  createDecision!: Sequelize.BelongsToCreateAssociationMixin<DecisionHistory>;

  static associate(models: typeof db.models) {
    TradingHistory.belongsTo(models.DecisionHistory, { as: 'decision', foreignKey: 'decisionId' });
  }

  static initModel(sequelize: Sequelize.Sequelize): typeof TradingHistory {
    return TradingHistory.init(
      {
        id: {
          type: DataTypes.UUID,
          allowNull: false,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        timestamp: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        pair: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        action: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        tokenIn: {
          type: DataTypes.STRING(255),
          allowNull: false,
          field: 'token_in',
        },
        tokenOut: {
          type: DataTypes.STRING(255),
          allowNull: false,
          field: 'token_out',
        },
        amountIn: {
          type: DataTypes.STRING(255),
          allowNull: false,
          field: 'amount_in',
        },
        expectedAmountOut: {
          type: DataTypes.STRING(255),
          allowNull: false,
          field: 'expected_amount_out',
        },
        txHash: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: 'trading_history_tx_hash_key',
          field: 'tx_hash',
        },
        status: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        error: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        message: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        decisionId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'decision_history',
            key: 'id',
          },
          field: 'decision_id',
        },
      },
      {
        sequelize,
        tableName: 'trading_history',
        schema: 'public',
        timestamps: true,
        indexes: [
          {
            name: 'trading_history_pkey',
            unique: true,
            fields: [{ name: 'id' }],
          },
          {
            name: 'trading_history_tx_hash_key',
            unique: true,
            fields: [{ name: 'tx_hash' }],
          },
        ],
      },
    );
  }
}
