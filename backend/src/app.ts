/**
 * Express application factory.
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import 'reflect-metadata';

import {errorHandler} from './core/errors/errorHandler';
import {requestLogger} from './core/middleware/requestLogger';

import authRoutes from './modules/auth/auth.routes';
import employeesRoutes from './modules/employees/employees.routes';
import branchesRoutes from './modules/branches/branches.routes';
import inventoryRoutes from './modules/inventory/inventory.routes';
import salesRoutes from './modules/sales/sales.routes';
import reportingRoutes from './modules/reporting/reporting.routes';
import lossReportsRoutes from './modules/loss-reports/loss-reports.routes';
import titakRoutes from './modules/integrations/titak/titak.routes';
import insuranceRoutes from './modules/integrations/insurance/insurance.routes';
import posRoutes from './modules/integrations/pos/pos.routes';
import purchasingRoutes from './modules/purchasing/purchasing.routes';
import setupRoutes from './modules/setup/setup.routes';
import settingsRoutes from './modules/settings/settings.routes';

export const createApp = () => {
    const app = express();

    app.use(helmet());
    app.use(cors());
    app.use(express.json({limit: '1mb'}));
    app.use(cookieParser());
    app.use(requestLogger);

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
    app.use('/api/v1/integrations/pos', posRoutes);
    app.use('/api/v1/purchasing', purchasingRoutes);
    app.use('/api/v1/settings', settingsRoutes);

    app.get('/health', (_req, res) => res.status(200).json({status: 'ok'}));

    // 404 for unknown API routes
    app.use('/api', (_req, res) => {
        res.status(404).json({
            success: false,
            code: 'NOT_FOUND',
            message: 'API route not found',
        });
    });

    app.use(errorHandler);

    return app;
};
