'use client';
import {useCallback} from 'react';
import {apiGet, apiPost, apiPut, apiPatch, apiDelete, ApiError} from '@/lib/api';
import {useError} from '@/context/ErrorContext';
import {clientLog} from '@/lib/logger';

function userFacingMessage(error: ApiError): string {
    if (error.status === 0) return error.message;
    if (error.status === 403) return error.message || 'You do not have permission for this action';
    if (error.status === 404) return error.message || 'Resource not found';
    if (error.status === 429) return 'Too many requests – please wait a moment';
    if (error.status >= 500) return 'Server error – please try again later';
    return error.message || 'Request failed';
}

export function useApi() {
    const {addError} = useError();

    const handleError = useCallback(
        (error: unknown) => {
            if (error instanceof ApiError) {
                // Avoid noisy toasts for auth bootstrap / silent redirects
                if (error.status === 401) {
                    clientLog.debug('Unauthorized (handled by interceptor)', {
                        code: error.code,
                        requestId: error.requestId,
                    });
                    return;
                }

                clientLog.warn('API call failed', {
                    status: error.status,
                    code: error.code,
                    requestId: error.requestId,
                    message: error.message,
                });

                addError({
                    message: userFacingMessage(error),
                    status: error.status,
                    code: error.code,
                    requestId: error.requestId,
                    severity: error.status >= 500 ? 'error' : 'warning',
                });
                return;
            }

            clientLog.error('Unexpected client error', {
                message: error instanceof Error ? error.message : String(error),
            });
            addError({
                message: 'An unexpected error occurred',
                severity: 'error',
            });
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
        async <T>(
            url: string,
            data?: unknown,
            config?: Parameters<typeof apiPost>[2]
        ): Promise<T | undefined> => {
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
        async <T>(
            url: string,
            data?: unknown,
            config?: Parameters<typeof apiPut>[2]
        ): Promise<T | undefined> => {
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
        async <T>(
            url: string,
            data?: unknown,
            config?: Parameters<typeof apiPatch>[2]
        ): Promise<T | undefined> => {
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

    return {get, post, put, patch, del, handleError};
}
