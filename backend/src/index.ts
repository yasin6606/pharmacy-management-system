/**
 * Process entrypoint.
 *
 * 1. Connect to PostgreSQL via TypeORM
 * 2. Create the Express app
 * 3. Start listening
 * 4. Schedule background jobs (expiration alerts)
 *
 * Fail-fast: any startup error is logged and the process exits with code 1
 * so orchestrators (Docker, k8s) can restart / alert.
 */
import {createApp} from './app';
import {AppDataSource} from './core/config/database';
import {env} from './core/config/env';
import {logger} from './core/logger/logger';
import {startExpirationAlertJob} from './modules/inventory/jobs/expirationAlertJob';

const startServer = async () => {
    try {
        await AppDataSource.initialize();
        logger.info('Database connected');

        const app = createApp();
        const port = Number(env.PORT) || 3001;

        app.listen(port, () => {
            logger.info(`Server running on port ${port} (${env.NODE_ENV})`);
        });

        // Daily 09:00 cron — logs batches nearing expiry
        startExpirationAlertJob();
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
