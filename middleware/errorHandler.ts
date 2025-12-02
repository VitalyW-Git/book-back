import { Request, Response, NextFunction } from 'express';
import createError from 'http-errors';

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction): void {
  next(createError(404));
}

export function errorHandler(err: Error & { status?: number }, req: Request, res: Response, _next: NextFunction): void {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
}

