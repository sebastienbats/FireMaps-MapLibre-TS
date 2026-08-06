import type { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

export interface AppError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error(`[${req.method}] ${req.path}: ${err.message}`);

  if (err.message?.includes('CORS')) {
    res.status(403).json({ error: 'Accès non autorisé (CORS)' });
    return;
  }

  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production' ? 'Erreur interne du serveur' : err.message;

  res.status(statusCode).json({ error: message });
};
