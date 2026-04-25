import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import dbConnection from './configs/db';
import authRoutes from './routes/auth.route';
import userRoutes from './routes/user.route';
import nutritionRoutes from './routes/nutrition.route';
import fitnessRoutes from './routes/fitness.route';
import scheduleRoutes from './routes/schedule.route';
import gamificationRoutes from './routes/gamification.route';
import communityRoutes from './routes/community.route';
import progressRoutes from './routes/progress.route';
import subscriptionsRoutes from './routes/subscriptions.route';
import webhooksRoutes from './routes/webhooks.route';
import groceryRoutes from './routes/grocery.route';
import familyRoutes from './routes/family.route';

import { corsOptions } from './configs/env';
import { errorHandler } from './middlewares/errorHandler';
import { requestLogger } from './middlewares/requestLogger';

const app = express();

dbConnection;

app.use(requestLogger);
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));



app.get('/', (req, res) => {
    res.send('<h1>Njerka.fit AI Powered App Server is running!</h1>');
});

app.get('/health', async (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});



app.use('/api/webhooks', webhooksRoutes);

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/fitness', fitnessRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/groceries', groceryRoutes);
app.use('/api/family', familyRoutes);

app.use(errorHandler);

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

export default app;