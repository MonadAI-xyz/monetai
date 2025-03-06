import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { TradingHistory, TradingHistoryId } from '@models';
import db from '@database';

export interface DecisionHistoryAttributes {
  id: string;
  decision: object;
  createdAt?: Date;
  updatedAt?: Date;
}

export type DecisionHistoryPk = 'id';
export type DecisionHistoryId = DecisionHistory[DecisionHistoryPk];
export type DecisionHistoryOptionalAttributes = 'id' | 'createdAt' | 'updatedAt';
export type DecisionHistoryCreationAttributes = Optional<DecisionHistoryAttributes, DecisionHistoryOptionalAttributes>;

export class DecisionHistory extends Model<DecisionHistoryAttributes, DecisionHistoryCreationAttributes> implements DecisionHistoryAttributes {
  id!: string;
  decision!: object;
  createdAt!: Date;
  updatedAt!: Date;

  // DecisionHistory hasMany TradingHistory via decisionId
  tradingHistories!: TradingHistory[];
  getTradingHistories!: Sequelize.HasManyGetAssociationsMixin<TradingHistory>;
  setTradingHistories!: Sequelize.HasManySetAssociationsMixin<TradingHistory, TradingHistoryId>;
  addTradingHistory!: Sequelize.HasManyAddAssociationMixin<TradingHistory, TradingHistoryId>;
  addTradingHistories!: Sequelize.HasManyAddAssociationsMixin<TradingHistory, TradingHistoryId>;
  createTradingHistory!: Sequelize.HasManyCreateAssociationMixin<TradingHistory>;
  removeTradingHistory!: Sequelize.HasManyRemoveAssociationMixin<TradingHistory, TradingHistoryId>;
  removeTradingHistories!: Sequelize.HasManyRemoveAssociationsMixin<TradingHistory, TradingHistoryId>;
  hasTradingHistory!: Sequelize.HasManyHasAssociationMixin<TradingHistory, TradingHistoryId>;
  hasTradingHistories!: Sequelize.HasManyHasAssociationsMixin<TradingHistory, TradingHistoryId>;
  countTradingHistories!: Sequelize.HasManyCountAssociationsMixin;

  static associate(models: typeof db.models) {
    DecisionHistory.hasMany(models.TradingHistory, { as: 'tradingHistories', foreignKey: 'decisionId' });
  }

  static initModel(sequelize: Sequelize.Sequelize): typeof DecisionHistory {
    return DecisionHistory.init(
      {
        id: {
          type: DataTypes.UUID,
          allowNull: false,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        decision: {
          type: DataTypes.JSONB,
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: 'decision_history',
        schema: 'public',
        timestamps: true,
        indexes: [
          {
            name: 'decision_history_pkey',
            unique: true,
            fields: [{ name: 'id' }],
          },
        ],
      },
    );
  }
}
