'use client';
import {useError} from '@/context/ErrorContext';
import {X, AlertTriangle, AlertCircle, Info} from 'lucide-react';
import {cn} from '@/lib/utils';

export function ErrorToast() {
    const {errors, removeError} = useError();

    if (errors.length === 0) return null;

    return (
        <div
            className="fixed bottom-4 end-4 z-50 space-y-2 w-[calc(100%-2rem)] max-w-xs sm:max-w-sm"
            role="region"
            aria-label="Notifications"
        >
            {errors.map((err) => {
                const severity = err.severity || 'error';
                const styles =
                    severity === 'warning'
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100'
                        : severity === 'info'
                          ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-100'
                          : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200';

                const Icon =
                    severity === 'warning'
                        ? AlertTriangle
                        : severity === 'info'
                          ? Info
                          : AlertCircle;

                return (
                    <div
                        key={err.id}
                        role="alert"
                        className={cn(
                            'border rounded-xl shadow-lg p-3 sm:p-4 flex items-start gap-2 backdrop-blur-sm',
                            styles
                        )}
                    >
                        <Icon className="h-4 w-4 mt-0.5 shrink-0 opacity-80" aria-hidden />
                        <div className="flex-1 min-w-0">
                            <strong className="block font-medium text-xs sm:text-sm">
                                {err.code
                                    ? err.code
                                    : err.status
                                      ? `Error (${err.status})`
                                      : 'Error'}
                            </strong>
                            <p className="text-xs sm:text-sm mt-0.5 break-words">{err.message}</p>
                            {err.requestId && (
                                <p className="text-[10px] opacity-60 mt-1 font-mono truncate">
                                    ref: {err.requestId}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={() => removeError(err.id)}
                            className="flex-shrink-0 rounded-full p-1 opacity-70 hover:opacity-100 transition-opacity"
                            aria-label="Dismiss"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
