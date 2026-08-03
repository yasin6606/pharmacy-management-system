'use client';
import {useCallback} from 'react';
import {apiGet, apiPost, apiPut, apiPatch, apiDelete, ApiError} from '@/lib/api';
import {useError} from '@/context/ErrorContext';

export function useApi() {
    const {addError} = useError();

    const handleError = useCallback(
        (error: any) => {
            console.log(error.message)
            if (error instanceof ApiError) {
                // 401 is already handled by interceptor, but we can still show a message
                addError({
                    id: crypto.randomUUID(),
                    message: error.message,
                    status: error.status,
                });
            } else {
                addError({
                    id: crypto.randomUUID(),
                    message: 'An unexpected error occurred',
                });
            }
        },
        [addError]
    );

    const get = useCallback(
        async <T>(url: string, config?: Parameters<typeof apiGet>[1]): Promise<T | undefined> => {
            try {
                return await apiGet<T>(url, config);
            } catch (error) {
                handleError(error);
                return undefined;
            }
        },
        [handleError]
    );

    const post = useCallback(
        async <T>(url: string, data?: any, config?: Parameters<typeof apiPost>[1]): Promise<T | undefined> => {
            try {
                return await apiPost<T>(url, data, config);
            } catch (error) {
                handleError(error);
                return undefined;
            }
        },
        [handleError]
    );

    const put = useCallback(
        async <T>(url: string, data?: any, config?: Parameters<typeof apiPut>[1]): Promise<T | undefined> => {
            try {
                return await apiPut<T>(url, data, config);
            } catch (error) {
                handleError(error);
                return undefined;
            }
        },
        [handleError]
    );

    const patch = useCallback(
        async <T>(url: string, data?: any, config?: Parameters<typeof apiPatch>[1]): Promise<T | undefined> => {
            try {
                return await apiPatch<T>(url, data, config);
            } catch (error) {
                handleError(error);
                return undefined;
            }
        },
        [handleError]
    );

    const del = useCallback(
        async <T>(url: string, config?: Parameters<typeof apiDelete>[1]): Promise<T | undefined> => {
            try {
                return await apiDelete<T>(url, config);
            } catch (error) {
                handleError(error);
                return undefined;
            }
        },
        [handleError]
    );

    return {get, post, put, patch, del};
}
