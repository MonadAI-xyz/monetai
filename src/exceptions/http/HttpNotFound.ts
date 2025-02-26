import { HttpError } from '@exceptions/http/HttpError';

export class HttpNotFound extends HttpError {
  constructor(message = 'Not found error', errors?: unknown) {
    super({
      message,
      status: 404,
      errors,
    });
  }
}
