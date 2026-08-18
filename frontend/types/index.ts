// ====================== Core Entities ======================

export type User = {
    id: string;
    email: string;
    fullName: string;
    role: 'junior' | 'senior' | 'manager' | 'accountant';
    currentBranchId: string | null;
    currentBranch?: Branch;
    createdAt: string;
};

export type Branch = {
    id: string;
    name: string;
    address: string | null;
    isWarehouse: boolean;
    hasFranchise?: boolean;
};

export type EmployeeSession = {
    id: string;
    employeeId: string;
    loginTime: string;
    logoutTime: string | null;
    ipAddress: string | null;
    employee?: User;
};

export type EmployeeBranchHistory = {
    id: string;
    employeeId: string;
    branchId: string;
    changedAt: string;
    employee?: User;
    branch?: Branch;
};

export type EmployeeResponse = {
    success: boolean;
    data: User[];
};

// ====================== Inventory ======================

export type DrugBatch = {
    id: string;
    drugId: string;
    branchId: string;
    expirationDate: string;
    count: number;
    isOffer: boolean;
    exchangedQuantity: number;
    purchasePrice?: number | null;
    sellingPrice?: number | null;
    version: number;
    drug?: Drug;
    branch?: Branch;
};

export type BranchInventoryResponse = {
    success: boolean;
    data: DrugBatch[];
};

export type Drug = {
    id: string;
    name: string;
    brand: string | null;
    company: string;
    enteringDate: string;
    lastPriceUpdateDate: string | null;
    titakCode?: string | null;
    insuranceEligible?: boolean;
    insuranceCode?: string | null;
    batches?: DrugBatch[];
};

export type StockMovement = {
    id: string;
    drugBatchId: string;
    type: 'transfer' | 'adjustment' | 'sale';
    quantity: number;
    fromBranchId: string | null;
    toBranchId: string | null;
    performedById: string;
    createdAt: string;
    note: string | null;
    drugBatch?: DrugBatch;
    fromBranch?: Branch;
    toBranch?: Branch;
    performedBy?: User;
};

// ====================== Sales ======================

export type Sale = {
    id: string;
    drugBatchId: string;
    employeeId: string;
    branchId: string;
    basketId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    soldDate: string;
    isOfferSale: boolean;
    isExchange: boolean;
    prescriptionRef: string | null;
    drugBatch?: DrugBatch;
    employee?: User;
    branch?: Branch;
    paymentMethod?: 'cash' | 'transfer' | 'pos' | 'credit';
    customerName?: string | null;
    customerFamily?: string | null;
    customerPhone?: string | null;
    posReference?: string | null;
    isPaid?: boolean;
    insuranceProvider?: 'none' | 'tamin' | 'salamat' | 'mosalah' | 'other';
    insuranceMemberId?: string | null;
    insuranceCoverageAmount?: number;
    patientShareAmount?: number;
};

export type SaleResponse = {
    success: boolean;
    data: Sale[];
};

// ====================== Purchasing ======================

export type Supplier = {
    id: string;
    name: string;
    contact: string | null;
};

export type PurchaseOrder = {
    id: string;
    supplierId: string;
    branchId: string;
    createdById: string;
    createdAt: string;
    items: any;
    invoiceImageUrl: string | null;
    supplier?: Supplier;
    branch?: Branch;
    createdBy?: User;
};

// ====================== Loss Reports ======================

export type LossReport = {
    id: string;
    reportedById: string;
    branchId: string;
    drugId: string;
    quantity: number;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    reviewedById: string | null;
    reviewedAt: string | null;
    createdAt: string;
    reportedBy?: User;
    branch?: Branch;
    drug?: Drug;
    reviewedBy?: User;
    availableStock?: number;
};

export type LossReportResponse = {
    success: boolean;
    data: LossReport[];
};

export type Notification = {
    id: string;
    type: 'expiration' | 'low_stock' | 'loss_report';
    title: string;
    message: string;
    branchId: string;
    read: boolean;
    createdAt: string;
    data?: any;
};

export type SalesReportItem = {
    date: string;
    branch: string;
    employee: string;
    drug: string;
    totalQuantity: number;
    totalRevenue: number;
};

export type InventorySummary = {
    totalDrugs: number;
    totalBatches: number;
    expiringCount: number;
    lowStockCount: number;
    totalValue: number;
};

export type ApiResponse<T> = {
    success: boolean;
    data: T;
    message?: string;
};

export type ApiError = {
    success: false;
    message: string;
    statusCode: number;
};

export type LoginRequest = {
    email: string;
    password: string;
};

export type LoginResponse = {
    employee: User;
    token: string;
};

export type SetupRequest = {
    email: string;
    password: string;
    fullName: string;
};

export type SetupResponse = {
    id: string;
    email: string;
};

export type CreateEmployeeInput = {
    email: string;
    password: string;
    fullName: string;
    role: User['role'];
    currentBranchId?: string;
};

export type UpdateEmployeeInput = Partial<Omit<CreateEmployeeInput, 'password'>>;

export type CreateBranchInput = {
    name: string;
    address?: string;
    isWarehouse?: boolean;
};

export type CreateDrugInput = {
    name: string;
    brand?: string;
    company: string;
    enteringDate: string;
    titakCode?: string;
    insuranceEligible?: boolean;
    insuranceCode?: string;
};

export type AddBatchInput = {
    drugId: string;
    branchId: string;
    expirationDate: string;
    count: number;
    isOffer?: boolean;
    exchangedQuantity?: number;
    purchasePrice?: number;
    sellingPrice?: number;
};

export type TransferStockInput = {
    batchId: string;
    toBranchId: string;
    quantity: number;
};

export type RecordSaleInput = {
    drugBatchId: string;
    quantity: number;
    prescriptionRef?: string;
};

export type CreateLossReportInput = {
    drugId: string;
    quantity: number;
    reason: string;
};

export type ReviewLossReportInput = {
    status: 'approved' | 'rejected';
};

export type SalesFilter = {
    branchId?: string;
    employeeId?: string;
    startDate?: string;
    endDate?: string;
};

export type InventoryFilter = {
    branchId?: string;
    drugId?: string;
    expiringBefore?: string;
    lowStock?: boolean;
};

export type LossReportFilter = {
    branchId?: string;
    status?: LossReport['status'];
};

export type PaginatedResponse<T> = {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};

export type PaginationParams = {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    startDate?: string;
    endDate?: string;
    branchId?: string;
};
