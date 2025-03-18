import { Request, Response, NextFunction } from 'express';

// Type for an async express handler function
type AsyncFunction = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

/**
 * Wraps async functions to catch errors and pass to Express error middleware
 * @param fn Async Express handler function
 * @returns Express middleware function
 */
export const asyncHandler = (fn: AsyncFunction) => 
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
