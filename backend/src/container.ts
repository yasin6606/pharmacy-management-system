/**
 * Awilix dependency-injection container.
 *
 * All application services are registered as singletons so that:
 *  - the same instance is reused across requests (cheap & consistent)
 *  - routes/controllers resolve dependencies instead of calling `new`
 *  - unit tests can override registrations with mocks
 *
 * Usage in a route file:
 *   import container from '../../container';
 *   const authService = container.resolve<AuthService>('authService');
 */
import {createContainer, asClass, InjectionMode} from 'awilix';
import {AuthService} from './modules/auth/auth.service';
import {EmployeesService} from './modules/employees/employees.service';
import {BranchesService} from './modules/branches/branches.service';
import {InventoryService} from './modules/inventory/inventory.service';
import {SalesService} from './modules/sales/sales.service';
import {ReportingService} from './modules/reporting/reporting.service';
import {LossReportsService} from './modules/loss-reports/loss-reports.service';
import {TitakService} from './modules/integrations/titak/titak.service';
import {InsuranceService} from './modules/integrations/insurance/insurance.service';
import {PurchasingService} from './modules/purchasing/purchasing.service';
import {SetupService} from './modules/setup/setup.service';
import {SettingsService} from './modules/settings/settings.service';

const container = createContainer({
    // PROXY mode allows lazy resolution and circular-dep friendliness
    injectionMode: InjectionMode.PROXY,
});

container.register({
    authService: asClass(AuthService).singleton(),
    employeesService: asClass(EmployeesService).singleton(),
    branchesService: asClass(BranchesService).singleton(),
    inventoryService: asClass(InventoryService).singleton(),
    salesService: asClass(SalesService).singleton(),
    reportingService: asClass(ReportingService).singleton(),
    lossReportsService: asClass(LossReportsService).singleton(),
    titakService: asClass(TitakService).singleton(),
    insuranceService: asClass(InsuranceService).singleton(),
    purchasingService: asClass(PurchasingService).singleton(),
    setupService: asClass(SetupService).singleton(),
    settingsService: asClass(SettingsService).singleton(),
});

export default container;
