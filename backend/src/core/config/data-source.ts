/**
 * Standalone TypeORM DataSource for the CLI (migrations generate / run).
 *
 * Usage:
 *   npm run migration:generate -- src/migrations/InitSchema
 *   npm run migration:run
 *   npm run migration:revert
 *
 * Keep this file in sync with `database.ts` entity list.
 * Prefer migrations over `synchronize: true` in any shared / production environment.
 */
import {DataSource} from 'typeorm';
import {env} from './env';
import {Branch} from '../../modules/branches/entities/Branch';
import {Employee} from '../../modules/employees/entities/Employee';
import {EmployeeSession} from '../../modules/auth/entities/EmployeeSession';
import {Drug} from '../../modules/inventory/entities/Drug';
import {DrugBatch} from '../../modules/inventory/entities/DrugBatch';
import {StockMovement} from '../../modules/inventory/entities/StockMovement';
import {SaleTransaction} from '../../modules/sales/entities/SaleTransaction';
import {Supplier} from '../../modules/purchasing/entities/Supplier';
import {PurchaseOrder} from '../../modules/purchasing/entities/PurchaseOrder';
import {LossReport} from '../../modules/loss-reports/entities/LossReport';
import {EmployeeBranchHistory} from '../../modules/employees/entities/EmployeeBranchHistory';
import {Settings} from '../../modules/settings/entities/Settings';

export default new DataSource({
    type: 'postgres',
    username: env.DATABASE_USERNAME,
    password: env.DATABASE_PASSWORD,
    url: env.DATABASE_URL,
    // CLI never auto-syncs — schema changes go through migration files only
    synchronize: false,
    logging: true,
    entities: [
        Branch,
        Employee,
        EmployeeSession,
        Drug,
        DrugBatch,
        StockMovement,
        SaleTransaction,
        Supplier,
        PurchaseOrder,
        LossReport,
        EmployeeBranchHistory,
        Settings,
    ],
    migrations: ['src/migrations/*.{ts,js}'],
    subscribers: [],
});
