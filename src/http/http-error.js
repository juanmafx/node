export class HttpError extends Error {
  constructor(statusCode, code, headers = {}) {
    super(code);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.code = code;
    this.headers = headers;
  }
}
