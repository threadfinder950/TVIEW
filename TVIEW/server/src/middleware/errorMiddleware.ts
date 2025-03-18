import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface CustomError extends Error {
  statusCode?: number;
  errors?: any[];
}

export const errorHandler = (
  err: CustomError, 
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  // Set default status code and message
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Server Error';
  
  // Log the error
  if (statusCode === 500) {
    logger.error(`[${req.method}] ${req.path} >> ${err.stack}`);
  } else {
    logger.warn(`[${req.method}] ${req.path} >> ${message}`);
  }
  
  // Return error response
  res.status(statusCode).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    errors: err.errors
  });
};

export class ErrorResponse extends Error {
  statusCode: number;
  errors?: any[];
  
  constructor(message: string, statusCode: number, errors?: any[]) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    
    // This captures the proper prototype chain
    Object.setPrototypeOf(this, ErrorResponse.prototype);
  }
}
