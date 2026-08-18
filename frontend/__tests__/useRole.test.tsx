import React from 'react';
import {renderHook} from '@testing-library/react';
import {useRole} from '@/hooks/useRole';

const mockUseAuth = jest.fn();

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('useRole', () => {
  it('manager gets management flags', () => {
    mockUseAuth.mockReturnValue({user: {role: 'manager'}});
    const {result} = renderHook(() => useRole());
    expect(result.current.isManager).toBe(true);
    expect(result.current.canManageEmployees).toBe(true);
    expect(result.current.canManageBranches).toBe(true);
    expect(result.current.canViewAllReports).toBe(true);
    expect(result.current.canApproveLoss).toBe(true);
  });

  it('junior cannot manage employees or approve loss', () => {
    mockUseAuth.mockReturnValue({user: {role: 'junior'}});
    const {result} = renderHook(() => useRole());
    expect(result.current.isJunior).toBe(true);
    expect(result.current.canManageEmployees).toBe(false);
    expect(result.current.canApproveLoss).toBe(false);
    expect(result.current.canRecordSales).toBe(true);
  });

  it('accountant can view reports but not manage branches', () => {
    mockUseAuth.mockReturnValue({user: {role: 'accountant'}});
    const {result} = renderHook(() => useRole());
    expect(result.current.canViewAllReports).toBe(true);
    expect(result.current.canManageBranches).toBe(false);
  });

  it('handles missing user safely', () => {
    mockUseAuth.mockReturnValue({user: null});
    const {result} = renderHook(() => useRole());
    expect(result.current.isManager).toBe(false);
    expect(result.current.canRecordSales).toBe(true);
  });
});
