/**
 * Express application factory.
 *
 * Creates a fully configured Express app with security middleware,
 * JSON parsing, route mounting, health check, and centralized error handling.
 * Kept pure (no listen / DB init) so tests can import `createApp()` safely.
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import 'reflect-metadata';

import {errorHandler} from './core/errors/errorHandler';

import authRoutes from './modules/auth/auth.routes';
import employeesRoutes from './modules/employees/employees.routes';
import branchesRoutes from './modules/branches/branches.routes';
import inventoryRoutes from './modules/inventory/inventory.routes';
import salesRoutes from './modules/sales/sales.routes';
import reportingRoutes from './modules/reporting/reporting.routes';
import lossReportsRoutes from './modules/loss-reports/loss-reports.routes';
import titakRoutes from './modules/integrations/titak/titak.routes';
import insuranceRoutes from './modules/integrations/insurance/insurance.routes';
import purchasingRoutes from './modules/purchasing/purchasing.routes';
import setupRoutes from './modules/setup/setup.routes';
import settingsRoutes from './modules/settings/settings.routes';

export const createApp = () => {
    const app = express();

    // ---- Security & parsing ----
    app.use(helmet()); // HTTP security headers
    // TODO: restrict origin in production via CORS_ORIGIN env
    app.use(cors());
    app.use(express.json({limit: '1mb'}));
    app.use(cookieParser());

    // ---- API routes (versioned under /api/v1) ----
    // Setup is public so a fresh install can create the first manager
    app.use('/api/v1', setupRoutes);
    app.use('/api/v1/auth', authRoutes);
    app.use('/api/v1/employees', employeesRoutes);
    app.use('/api/v1/branches', branchesRoutes);
    app.use('/api/v1/inventory', inventoryRoutes);
    app.use('/api/v1/sales', salesRoutes);
    app.use('/api/v1/reporting', reportingRoutes);
    app.use('/api/v1/loss-reports', lossReportsRoutes);
    app.use('/api/v1/integrations/titak', titakRoutes);
    app.use('/api/v1/integrations/insurance', insuranceRoutes);
    app.use('/api/v1/purchasing', purchasingRoutes);
    app.use('/api/v1/settings', settingsRoutes);

    // Liveness probe for Docker / load balancers
    app.get('/health', (_req, res) => res.status(200).json({status: 'ok'}));

    // Must be registered last — catches AppError and unexpected exceptions
    app.use(errorHandler);

    return app;
};
