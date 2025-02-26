class HttpException extends Error {
  public status: number;
  public message: string;
  public errors: any;

  constructor(status: number, message: string, errors: any = undefined) {
    super(message);
    this.status = status;
    this.message = message;
    this.errors = errors;
  }
}

export default HttpException;
