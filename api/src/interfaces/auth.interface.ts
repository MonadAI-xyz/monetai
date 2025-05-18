import { Request } from 'express';

export interface ITokenData {
  token: string;
  expiresIn: number;
}

export interface IRequestWithUser extends Request {
  user: {
    id: string;
    [key: string]: any;
  };
  namespace?: string;
  data?: any;
  status?: number;
  userIP?: string;
  id?: string;
}
