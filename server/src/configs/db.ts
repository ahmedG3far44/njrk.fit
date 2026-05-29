import { env } from './env';
import mongoose from 'mongoose';

export const dbConnection = mongoose.connect(env.MONGODB_URI!).then(() => {
    console.log('Connected to MongoDB');
}).catch(() => {
    console.log('Failed to connect to MongoDB');
    process.exit(1);
});

export default dbConnection;