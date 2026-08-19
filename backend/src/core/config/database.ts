import {DataSource} from 'typeorm';
import {env} from './env';
import {Branch} from '../../modules/branches/entities/Branch';
import {Employee} from '../../modules/employees/entities/Employee';
import {EmployeeSession} from '../../modules/auth/entities/EmployeeSession';
import {Drug} from '../../modules/inventory/entities/Drug';
import {DrugBatch} from '../../modules/inventory/entities/DrugBatch';
import {StockMovement} from '../../modules/inventory/entities/StockMovement';
import {ControlledDrugLog} from '../../modules/inventory/entities/ControlledDrugLog';
import {SaleTransaction} from '../../modules/sales/entities/SaleTransaction';
import {Supplier} from '../../modules/purchasing/entities/Supplier';
import {PurchaseOrder} from '../../modules/purchasing/entities/PurchaseOrder';
import {GoodsReceipt} from '../../modules/purchasing/entities/GoodsReceipt';
import {LossReport} from '../../modules/loss-reports/entities/LossReport';
import {EmployeeBranchHistory} from '../../modules/employees/entities/EmployeeBranchHistory';
import {Settings} from '../../modules/settings/entities/Settings';
import {IntegrationSetting} from '../../modules/settings/entities/IntegrationSetting';
import {Customer} from '../../modules/customers/entities/Customer';
import {Prescription} from '../../modules/prescriptions/entities/Prescription';
import {InvoiceSequence} from '../../modules/invoicing/entities/InvoiceSequence';
import {CashShift} from '../../modules/shifts/entities/CashShift';
import {AuditLog} from '../../modules/audit/entities/AuditLog';
import {DrugInteraction} from '../../modules/clinical/entities/DrugInteraction';
import {NotificationOutbox} from '../../modules/notifications/entities/NotificationOutbox';

const shouldSynchronize =
    env.TYPEORM_SYNCHRONIZE === 'true' ||
    (env.TYPEORM_SYNCHRONIZE !== 'false' && env.NODE_ENV === 'development');

export const AppDataSource = new DataSource({
    type: 'postgres',
    username: env.DATABASE_USERNAME,
    password: env.DATABASE_PASSWORD,
    url: env.DATABASE_URL,
    synchronize: shouldSynchronize,
    logging: env.NODE_ENV === 'development',
    entities: [
        Branch,
        Employee,
        EmployeeSession,
        Drug,
        DrugBatch,
        StockMovement,
        ControlledDrugLog,
        SaleTransaction,
        Supplier,
        PurchaseOrder,
        GoodsReceipt,
        LossReport,
        EmployeeBranchHistory,
        Settings,
        IntegrationSetting,
        Customer,
        Prescription,
        InvoiceSequence,
        CashShift,
        AuditLog,
        DrugInteraction,
        NotificationOutbox,
    ],
    migrations: [__dirname + '/../../migrations/*.{ts,js}'],
    subscribers: [],
});
