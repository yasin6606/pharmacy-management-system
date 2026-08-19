import axios from 'axios';
import {clientLog} from '@/lib/logger';

let API_URL = '';

if (process.env.NODE_ENV === 'production') {
    API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
} else {
    API_URL = 'http://localhost:3001/api/v1';
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    data: T;
    message?: string;
    code?: string;
    details?: unknown;
    requestId?: string;
}

export class ApiError extends Error {
    public status: number;
    public code?: string;
    public data?: unknown;
    public requestId?: string;

    constructor(status: number, message: string, data?: unknown, code?: string, requestId?: string) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
        this.code = code;
        this.requestId = requestId;
    }
}

export const api = axios.create({
    baseURL: API_URL,
    withCredentials: false,
    headers: {'Content-Type': 'application/json'},
    timeout: 30000,
});

function getLocaleFromPath(): string {
    if (typeof window === 'undefined') return 'en';
    const segments = window.location.pathname.split('/').filter(Boolean);
    const first = segments[0];
    return first === 'fa' || first === 'en' ? first : 'en';
}

function redirectToLogin() {
    const locale = getLocaleFromPath();
    window.location.replace(`/${locale}/login`);
}

api.interceptors.request.use((config) => {
    const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('token') : null;
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    // Correlate with backend request logs when possible
    if (config.headers && !config.headers['x-request-id']) {
        config.headers['x-request-id'] =
            typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : `${Date.now()}`;
    }
    return config;
});

let isRedirecting = false;

api.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
        const ax = error as {
            response?: {status: number; data?: any; headers?: Record<string, string>};
            config?: {url?: string; method?: string};
            message?: string;
            code?: string;
        };

        if (!ax.response) {
            const isTimeout = ax.code === 'ECONNABORTED' || /timeout/i.test(ax.message || '');
            clientLog.error(isTimeout ? 'API timeout' : 'Network error', {
                url: ax.config?.url,
                method: ax.config?.method,
            });
            return Promise.reject(
                new ApiError(
                    0,
                    isTimeout
                        ? 'Request timed out – please try again'
                        : 'Network error – please check your connection',
                    undefined,
                    isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR'
                )
            );
        }

        const {status, data} = ax.response;
        const requestUrl = ax.config?.url ?? '';
        const isAuthMeRequest = requestUrl.includes('/auth/me');
        const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

        if (
            status === 401 &&
            !isAuthMeRequest &&
            typeof window !== 'undefined' &&
            !pathname.includes('/login') &&
            !pathname.includes('/setup')
        ) {
            if (!isRedirecting) {
                isRedirecting = true;
                sessionStorage.removeItem('token');
                clientLog.warn('Session expired – redirecting to login');
                redirectToLogin();
            }
        }

        const message =
            data?.message || data?.error || `Request failed with status ${status}`;
        const code = data?.code as string | undefined;
        const requestId =
            data?.requestId ||
            ax.response.headers?.['x-request-id'] ||
            ax.response.headers?.['X-Request-Id'];

        if (status >= 500) {
            clientLog.error('API server error', {status, url: requestUrl, code, requestId, message});
        } else if (status >= 400 && status !== 401) {
            clientLog.warn('API client error', {status, url: requestUrl, code, requestId, message});
        }

        return Promise.reject(new ApiError(status, message, data, code, requestId));
    }
);

async function request<T>(
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    url: string,
    body?: unknown,
    config?: object
): Promise<T> {
    try {
        let response: {data: ApiResponse<T>};
        switch (method) {
            case 'get':
                response = await api.get<ApiResponse<T>>(url, config);
                break;
            case 'post':
                response = await api.post<ApiResponse<T>>(url, body, config);
                break;
            case 'put':
                response = await api.put<ApiResponse<T>>(url, body, config);
                break;
            case 'patch':
                response = await api.patch<ApiResponse<T>>(url, body, config);
                break;
            case 'delete':
                response = await api.delete<ApiResponse<T>>(url, config);
                break;
        }
        return response.data.data;
    } catch (error: unknown) {
        if (error instanceof ApiError) throw error;
        clientLog.error('Unexpected API failure', {url, method});
        throw new ApiError(500, 'Unexpected error', error, 'UNEXPECTED');
    }
}

export function apiGet<T>(url: string, config?: object) {
    return request<T>('get', url, undefined, config);
}

export function apiPost<T>(url: string, data?: unknown, config?: object) {
    return request<T>('post', url, data, config);
}

export function apiPut<T>(url: string, data?: unknown, config?: object) {
    return request<T>('put', url, data, config);
}

export function apiPatch<T>(url: string, data?: unknown, config?: object) {
    return request<T>('patch', url, data, config);
}

export function apiDelete<T>(url: string, config?: object) {
    return request<T>('delete', url, undefined, config);
}
