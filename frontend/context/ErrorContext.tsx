'use client';
import React, {createContext, useContext, useState, useCallback} from 'react';

export interface AppError {
    id: string;
    message: string;
    status?: number;
}

interface ErrorContextType {
    errors: AppError[];
    addError: (err: AppError) => void;
    removeError: (id: string) => void;
    clearAll: () => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export function ErrorProvider({children}: { children: React.ReactNode }) {
    const [errors, setErrors] = useState<AppError[]>([]);

    const addError = useCallback((err: AppError) => {
        setErrors(prev => [...prev, err]);
        // auto-remove after 8 seconds
        setTimeout(() => {
            setErrors(prev => prev.filter(e => e.id !== err.id));
        }, 8000);
    }, []);

    const removeError = useCallback((id: string) => {
        setErrors(prev => prev.filter(e => e.id !== id));
    }, []);

    const clearAll = useCallback(() => setErrors([]), []);

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
