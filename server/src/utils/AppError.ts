/**
 * Custom application error class with HTTP status codes.
 * Use this for all operational errors thrown in services/controllers.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    // Capture proper stack trace (excludes constructor call from it)
    Error.captureStackTrace(this, this.constructor);
  }
}
