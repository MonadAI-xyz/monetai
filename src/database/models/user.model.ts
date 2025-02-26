import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface UserAttributes {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserPk = 'id';
export type UserId = User[UserPk];
export type UserOptionalAttributes = 'id' | 'createdAt' | 'updatedAt';
export type UserCreationAttributes = Optional<UserAttributes, UserOptionalAttributes>;

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  id!: string;
  username!: string;
  email!: string;
  passwordHash!: string;
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
        username: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: 'users_username_key',
        },
        email: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: 'users_email_key',
        },
        passwordHash: {
          type: DataTypes.STRING(255),
          allowNull: false,
          field: 'password_hash',
        },
      },
      {
        sequelize,
        tableName: 'users',
        schema: 'public',
        timestamps: true,
        indexes: [
          {
            name: 'users_email_key',
            unique: true,
            fields: [{ name: 'email' }],
          },
          {
            name: 'users_pkey',
            unique: true,
            fields: [{ name: 'id' }],
          },
          {
            name: 'users_username_key',
            unique: true,
            fields: [{ name: 'username' }],
          },
        ],
      },
    );
  }
}
