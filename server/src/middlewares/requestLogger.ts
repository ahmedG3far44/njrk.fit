import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const timestamp = new Date().toISOString();
        const method = req.method;
        const url = req.originalUrl;
        const status = res.statusCode;
        const ip = req.ip || req.socket.remoteAddress;

        const log = {
            timestamp,
            method,
            url,
            status,
            duration: `${duration}ms`,
            ip,
            userAgent: req.get('user-agent') || '-',
        };

        if (status >= 500) {
            console.error(`[SERVER ERROR] ${JSON.stringify(log)}`);
        } else if (status >= 400) {
            console.warn(`[CLIENT ERROR] ${JSON.stringify(log)}`);
        } else {
            console.log(`[REQUEST] ${JSON.stringify(log)}`);
        }
    });

    next();
};