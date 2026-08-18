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

const shouldSynchronize =
    env.TYPEORM_SYNCHRONIZE === 'true' ||
    (env.TYPEORM_SYNCHRONIZE !== 'false' && env.NODE_ENV === 'development');

export const AppDataSource = new DataSource({
    type: 'postgres',
    username: env.DATABASE_USERNAME,
    password: env.DATABASE_PASSWORD,
    url: env.DATABASE_URL,
    // Prefer explicit TYPEORM_SYNCHRONIZE; fall back to development-only auto-sync
    synchronize: shouldSynchronize,
    logging: env.NODE_ENV === 'development',
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
    migrations: [],
    subscribers: [],
});
