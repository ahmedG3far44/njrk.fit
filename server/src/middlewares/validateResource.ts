import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validate = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors = error.issues.map((e) => ({
                    path: e.path.join('.'),
                    message: e.message,
                }));
                return res.status(400).json({ errors });
            }
            next(error);
        }
    };
};