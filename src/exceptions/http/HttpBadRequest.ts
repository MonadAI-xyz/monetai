import { HttpError } from '@exceptions/http/HttpError';

export class HttpBadRequest extends HttpError {
  constructor(message = 'Bad request error', errors?: unknown) {
    super({
      message,
      status: 400,
      errors,
    });
  }
}
