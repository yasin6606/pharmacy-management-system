import { createApp } from './app';
import { AppDataSource } from './core/config/database';
import { env } from './core/config/env';
import { logger } from './core/logger/logger';
import { startExpirationAlertJob } from './modules/inventory/jobs/expirationAlertJob';

const startServer = async () => {
    try {
        await AppDataSource.initialize();
        logger.info('Database connected');

        const app = createApp();
        app.listen(env.PORT, () => {
            logger.info(`Server running on port ${env.PORT}`);
        });

        startExpirationAlertJob();
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
