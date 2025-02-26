import { Request } from 'express';

export interface ITokenData {
  token: string;
  expiresIn: number;
}

export interface IRequestWithUser extends Request {
  user: any;
  headers: any;
  query: any;
  params: any;
  body: any;
  data?: any;
  status?: number;
  userIP?: string;

  namespace?: string;

  id?: string;
}
