'use client';
import React, {createContext, useContext, useState, useCallback, useRef} from 'react';

export type ErrorSeverity = 'error' | 'warning' | 'info';

export interface AppError {
    id: string;
    message: string;
    status?: number;
    code?: string;
    requestId?: string;
    severity?: ErrorSeverity;
}

interface ErrorContextType {
    errors: AppError[];
    addError: (err: Omit<AppError, 'id'> & {id?: string}) => void;
    removeError: (id: string) => void;
    clearAll: () => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

const MAX_TOASTS = 5;
const AUTO_DISMISS_MS = 8000;

export function ErrorProvider({children}: {children: React.ReactNode}) {
    const [errors, setErrors] = useState<AppError[]>([]);
    const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    const removeError = useCallback((id: string) => {
        setErrors((prev) => prev.filter((e) => e.id !== id));
        const t = timers.current.get(id);
        if (t) {
            clearTimeout(t);
            timers.current.delete(id);
        }
    }, []);

    const addError = useCallback(
        (err: Omit<AppError, 'id'> & {id?: string}) => {
            const id = err.id || (typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random()}`);

            const entry: AppError = {
                id,
                message: err.message,
                status: err.status,
                code: err.code,
                requestId: err.requestId,
                severity: err.severity || (err.status && err.status < 500 ? 'warning' : 'error'),
            };

            setErrors((prev) => {
                // Deduplicate identical messages already visible
                if (prev.some((e) => e.message === entry.message && e.status === entry.status)) {
                    return prev;
                }
                const next = [...prev, entry];
                return next.slice(-MAX_TOASTS);
            });

            const timer = setTimeout(() => removeError(id), AUTO_DISMISS_MS);
            timers.current.set(id, timer);
        },
        [removeError]
    );

    const clearAll = useCallback(() => {
        timers.current.forEach((t) => clearTimeout(t));
        timers.current.clear();
        setErrors([]);
    }, []);

    return (
        <ErrorContext.Provider value={{errors, addError, removeError, clearAll}}>
            {children}
        </ErrorContext.Provider>
    );
}

export function useError() {
    const ctx = useContext(ErrorContext);
    if (!ctx) throw new Error('useError must be used inside ErrorProvider');
    return ctx;
}
