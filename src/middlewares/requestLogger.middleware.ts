import { Response } from 'express';
import { logger } from '@utils/logger';
import { IRequestWithUser } from '@interfaces/auth.interface';
import requestIp from 'request-ip';
import * as uuid from 'uuid';

const requestLoggerMiddleware = (req: IRequestWithUser, res: Response, time: string | number): void => {
  try {
    const method = req.method;
    const url = req.url;
    const status = res.statusCode;
    req.userIP = requestIp.getClientIp(req) || null;
    req.id = uuid.v4();

    if (req?.body?.password) {
      req.body.password = '*******';
    }
    logger.info({
      message: `[${method}]`,
      method,
      url,
      status,
      duration: `${time}`,
      ip: req.userIP,
      id: req.id,
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
  } catch (error) {
    console.log('[REQUEST LOGGER MIDDLEWARE] Error:', error);
  }
};
export default requestLoggerMiddleware;
