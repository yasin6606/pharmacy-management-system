import axios from 'axios';

let API_URL: string = "";

if (process.env.NODE_ENV === "production")
    API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
else
    API_URL = "http://localhost:3001/api/v1"

// ---------- Types ----------
export interface ApiResponse<T = any> {
    success: boolean;
    data: T;
    message?: string;
}

export class ApiError extends Error {
    public status: number;
    public data?: any;

    constructor(status: number, message: string, data?: any) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

// ---------- Axios Instance ----------
export const api = axios.create({
    baseURL: API_URL,
    withCredentials: false,
    headers: {'Content-Type': 'application/json'},
});

// ---------- Helpers ----------
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

// ---------- Interceptors ----------
api.interceptors.request.use((config) => {
    const token = sessionStorage.getItem('token');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

let isRedirecting = false;

api.interceptors.response.use(
    (response) => response,
    (error: any) => {
        if (!error.response) {
            return Promise.reject(new ApiError(0, 'Network error – please check your connection'));
        }

        const {status, data}: any = error.response;
        const requestUrl = error.config?.url ?? '';
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
                redirectToLogin();
            }
        }

        const message =
            data?.message || data?.error || `Request failed with status ${status}`;

        return Promise.reject(new ApiError(status, message, data));
    }
);

// ---------- Typed request helper ----------
async function request<T>(
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    url: string,
    body?: any,
    config?: any
): Promise<T> {
    try {
        let response: { data: ApiResponse<T> };
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
    } catch (error: any) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, 'Unexpected error', error);
    }
}

export function apiGet<T>(url: string, config?: any) {
    return request<T>('get', url, undefined, config);
}

export function apiPost<T>(url: string, data?: any, config?: any) {
    return request<T>('post', url, data, config);
}

export function apiPut<T>(url: string, data?: any, config?: any) {
    return request<T>('put', url, data, config);
}

export function apiPatch<T>(url: string, data?: any, config?: any) {
    return request<T>('patch', url, data, config);
}

export function apiDelete<T>(url: string, config?: any) {
    return request<T>('delete', url, undefined, config);
}
