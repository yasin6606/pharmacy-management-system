// components/ui/ErrorToast.tsx
'use client';
import {useError} from '@/context/ErrorContext';
import {X} from 'lucide-react';
import {cn} from '@/lib/utils';

export function ErrorToast() {
    const {errors, removeError} = useError();

    if (errors.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 space-y-2 w-[calc(100%-2rem)] max-w-xs sm:max-w-sm">
            {errors.map((err) => (
                <div
                    key={err.id}
                    className={cn(
                        'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg shadow-lg p-3 sm:p-4 flex items-start gap-2',
                        'text-red-800 dark:text-red-200'
                    )}
                >
                    <div className="flex-1 min-w-0">
                        <strong className="block font-medium text-xs sm:text-sm">
                            {err.status ? `Error (${err.status})` : 'Error'}
                        </strong>
                        <p className="text-xs sm:text-sm mt-0.5 break-words">{err.message}</p>
                    </div>
                    <button
                        onClick={() => removeError(err.id)}
                        className="flex-shrink-0 rounded-full p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                        aria-label="Dismiss error"
                    >
                        <X className="h-4 w-4"/>
                    </button>
                </div>
            ))}
        </div>
    );
}
