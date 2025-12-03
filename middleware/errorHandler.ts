import { Request, Response, NextFunction } from "express";
import createError from "http-errors";

export function notFoundHandler(
  _req: Request,
  _res: Response,
  next: NextFunction
): void {
  next(createError(404));
}

export function errorHandler(
  err: Error & { status?: number },
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = err.status || 500;
  const isDevelopment = process.env.NODE_ENV !== "production";

  res.status(status);
  res.json({
    error: {
      message: err.message,
      status: status,
      ...(isDevelopment && { stack: err.stack }),
    },
  });
}
