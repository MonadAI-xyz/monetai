import config from '@config';
import { HttpError } from '@exceptions/http/HttpError';
import { IRequestWithUser } from '@interfaces/auth.interface';
import { HttpErrorParams } from '@interfaces/httpErrorParams.interface';
import { logger } from '@utils/logger';
import { NextFunction, Response } from 'express';
import 'express-async-errors';
import { v4 } from 'uuid';

export type HttpErrorResponse = Required<Pick<HttpErrorParams, 'status' | 'message'> & { code: string; traceId?: string; traceUrl?: string }> &
  Pick<HttpErrorParams, 'errors' | 'stack'>;

export function errorHandler(err: HttpError & { errors: any }, req: IRequestWithUser, res: Response, next: NextFunction): void {
  const id: string = v4();
  const customMessage = err?.errors?.errors?.customMessage;

  const response: HttpErrorResponse = {
    status: err?.errors?.status || err?.status || 500,
    code: err?.name?.toUpperCase(),
    message: customMessage ? customMessage : err?.errors?.message || err.message,
    errors: err?.errors?.errors || err?.errors || {},
    traceId: id,
    traceUrl: `/d/ae9spjm0bwv0ga/error?var-id=${id}`,
    stack: config.app.env.toUpperCase() !== 'PRODUCTION' ? err.stack : null,
  };

  if (req?.body?.password) {
    req.body.password = '*******';
  }
  logger.error({
    method: req.method,
    url: req.originalUrl,
    errors: err?.errors?.errors || err?.errors || {},
    status: err.status,
    message: err.message,
    code: err?.name?.toUpperCase(),
    stack: err.stack,
    id: response.traceId,
    request: {
      body: req.body,
      params: req.params,
      query: req.query,
      user: {
        id: req?.user?.id,
        ip: req.ip || req.userIP,
      },
    },
    labels: { origin: 'api' },
  });

  res.status(response.status).json(response);

  next();
}
