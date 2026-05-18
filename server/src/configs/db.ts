import { env } from './env';
import mongoose from 'mongoose';

export const dbConnection = mongoose.connect(env.MONGODB_URI!, {
    serverSelectionTimeoutMS: 10000,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((error) => {
    console.error('Failed to connect to MongoDB:', error.message);
    process.exit(1);
});

export default dbConnection;
