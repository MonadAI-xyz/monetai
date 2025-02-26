import { IError } from '@interfaces/error.interface';
import { HttpErrorParams } from '@interfaces/httpErrorParams.interface';

export class HttpError extends Error {
  errors: IError;
  status: number;

  /**
   * Creates an API error instance.
   * @param params
   */
  constructor(params: HttpErrorParams = {}) {
    const { message = 'Internal server error', errors, stack, status = 500 } = params;
    super(message);
    this.message = message;
    this.errors = errors;
    this.status = status;
    this.stack = stack;
    console.log('Error params', params);
    Error.captureStackTrace(this, this.constructor);
  }
}
