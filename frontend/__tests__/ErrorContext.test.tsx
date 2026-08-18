import React from 'react';
import {act, renderHook} from '@testing-library/react';
import {ErrorProvider, useError} from '@/context/ErrorContext';

function wrapper({children}: {children: React.ReactNode}) {
  return <ErrorProvider>{children}</ErrorProvider>;
}

describe('ErrorContext', () => {
  it('adds and removes errors', () => {
    const {result} = renderHook(() => useError(), {wrapper});

    act(() => {
      result.current.addError({id: '1', message: 'boom', status: 500});
    });
    expect(result.current.errors).toHaveLength(1);
    expect(result.current.errors[0].message).toBe('boom');

    act(() => {
      result.current.removeError('1');
    });
    expect(result.current.errors).toHaveLength(0);
  });

  it('clearAll empties the list', () => {
    const {result} = renderHook(() => useError(), {wrapper});
    act(() => {
      result.current.addError({id: 'a', message: '1'});
      result.current.addError({id: 'b', message: '2'});
    });
    expect(result.current.errors.length).toBeGreaterThanOrEqual(2);
    act(() => result.current.clearAll());
    expect(result.current.errors).toHaveLength(0);
  });
});
