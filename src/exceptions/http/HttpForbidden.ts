import { HttpError } from '@exceptions/http/HttpError';

export class HttpForbidden extends HttpError {
  constructor(message = 'Forbidden error', errors?: unknown) {
    super({
      message,
      status: 403,
      errors,
    });
  }
}
