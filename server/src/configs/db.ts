import { env } from './env';
import mongoose from 'mongoose';

mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Disconnected from MongoDB');
});

export const dbConnection = mongoose.connect(env.MONGODB_URI).catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
});

export default dbConnection;
