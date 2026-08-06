import type { Request, Response, NextFunction } from 'express';
import { body, type ValidationChain, validationResult } from 'express-validator';

export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: 'Données invalides', details: errors.array() });
    return;
  }
  next();
};

export const validateExport: ValidationChain[] = [
  body('filename').isString().trim().isLength({ min: 1, max: 100 }),
  body('data').exists(),
  body('format').optional().isIn(['geojson', 'csv']),
];
