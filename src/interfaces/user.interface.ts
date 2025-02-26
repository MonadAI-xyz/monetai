export interface IUser {
  id?: string;
  email: string;
  passwordHash: string;
  dataValues?: any;
  createdAt?: Date;
  updatedAt?: Date;
}
