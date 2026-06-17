import { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';

export class AppError extends Error {
    statusCode: number;
    isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

export const errorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
) => {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            error: err.message,
        });
    }

    if (err instanceof MulterError) {
        return res.status(400).json({
            error: err.code === 'LIMIT_FILE_SIZE'
                ? 'File too large. Maximum size is 5MB.'
                : err.message,
        });
    }

    if ('type' in err && typeof err.type === 'string' && err.type.startsWith('Stripe')) {
        const stripeErr = err as Error & { statusCode?: number };
        return res.status(stripeErr.statusCode || 500).json({
            error: stripeErr.message,
        });
    }

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: err.message,
        });
    }

    if (err.name === 'CastError') {
        return res.status(400).json({
            error: 'Invalid resource ID format',
        });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Invalid token',
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Token expired',
        });
    }

    if (err.name === 'MongoServerError' && (err as any).code === 11000) {
        return res.status(409).json({
            error: 'This resource already exists with the same identifier',
        });
    }

    if (err.name === 'PayloadTooLargeError') {
        return res.status(413).json({
            error: 'Request entity too large',
        });
    }

    console.error('Unhandled error:', err);

    return res.status(500).json({
        error: 'Internal server error',
    });
};
