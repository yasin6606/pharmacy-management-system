import { createContainer, asClass, asValue } from 'awilix';
import { AuthService } from './modules/auth/auth.service';
import { EmployeesService } from './modules/employees/employees.service';
import { BranchesService } from './modules/branches/branches.service';
import { InventoryService } from './modules/inventory/inventory.service';
import { SalesService } from './modules/sales/sales.service';
import { ReportingService } from './modules/reporting/reporting.service';
import { LossReportsService } from './modules/loss-reports/loss-reports.service';
import { TitakService } from './modules/integrations/titak/titak.service';
import { InsuranceService } from './modules/integrations/insurance/insurance.service';
import { PurchasingService } from './modules/purchasing/purchasing.service';

const container = createContainer();

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
});

export default container;
