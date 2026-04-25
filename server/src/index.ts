import app from './app';
import dbConnection from './configs/db';
import { env } from './configs/env';

async function startServer() {
    await dbConnection;
    app.listen(Number(env.PORT), '0.0.0.0', () => {
        console.log(`Server is running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });
}


startServer();