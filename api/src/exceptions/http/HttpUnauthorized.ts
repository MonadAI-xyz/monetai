import { HttpError } from '@exceptions/http/HttpError';

export class HttpUnauthorized extends HttpError {
  constructor(message = 'Unauthorized: please sign in', errors?: unknown) {
    super({
      message,
      status: 401,
      errors,
    });
  }
}
