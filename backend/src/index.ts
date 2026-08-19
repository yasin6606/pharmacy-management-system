/**
 * Process entrypoint.
 */
import {createApp} from './app';
import {AppDataSource} from './core/config/database';
import {env} from './core/config/env';
import {logger} from './core/logger/logger';
import {startExpirationAlertJob} from './modules/inventory/jobs/expirationAlertJob';

const startServer = async () => {
    try {
        await AppDataSource.initialize();
        logger.info('Database connected', {synchronize: AppDataSource.options.synchronize});

        const app = createApp();
        const port = Number(env.PORT) || 3001;

        app.listen(port, () => {
            logger.info('Server listening', {port, env: env.NODE_ENV});
        });

        startExpirationAlertJob();
    } catch (error) {
        logger.error('Failed to start server', {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
        process.exit(1);
    }
};

// Process-level safety nets
process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', {
        reason: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
    });
});

process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', {message: err.message, stack: err.stack});
    process.exit(1);
});

startServer();
