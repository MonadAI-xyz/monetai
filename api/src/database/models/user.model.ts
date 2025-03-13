import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface UserAttributes {
  id: string;
  wallet_address: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserPk = 'id';
export type UserId = User[UserPk];
export type UserOptionalAttributes = 'id' | 'createdAt' | 'updatedAt';
export type UserCreationAttributes = Optional<UserAttributes, UserOptionalAttributes>;

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  id!: string;
  wallet_address!: string;
  createdAt!: Date;
  updatedAt!: Date;

  static initModel(sequelize: Sequelize.Sequelize): typeof User {
    return User.init(
      {
        id: {
          type: DataTypes.UUID,
          allowNull: false,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        wallet_address: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: true,
        },
      },
      {
        sequelize,
        tableName: 'users',
        schema: 'public',
        timestamps: true,
        indexes: [
          {
            name: 'users_pkey',
            unique: true,
            fields: [{ name: 'id' }],
          },
          {
            name: 'users_wallet_address_key',
            unique: true,
            fields: [{ name: 'wallet_address' }],
          },
        ],
      },
    );
  }
}
