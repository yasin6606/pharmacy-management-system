import{ useAuth } from '@/context/AuthContext';;

export function useRole() {
  const { user } = useAuth();

  const isJunior = user?.role === 'junior';
  const isSenior = user?.role === 'senior';
  const isManager = user?.role === 'manager';
  const isAccountant = user?.role === 'accountant';

  const canManageEmployees = isManager;
  const canManageBranches = isManager;
  const canViewAllReports = isManager || isAccountant;
  const canApproveLoss = isSenior || isManager;
  const canAdjustStock = isSenior || isManager;
  const canRecordSales = true; // all roles

  return {
    isJunior, isSenior, isManager, isAccountant,
    canManageEmployees, canManageBranches, canViewAllReports,
    canApproveLoss, canAdjustStock, canRecordSales,
  };
}
