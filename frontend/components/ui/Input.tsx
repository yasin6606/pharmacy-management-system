'use client';
import {forwardRef, InputHTMLAttributes, useId} from 'react';
import {cn} from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    error?: string;
    label?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({className, error, label, id, type, ...props}, ref) => {
        const generatedId = useId();
        const inputId = id || generatedId;

        return (
            <div className="space-y-1.5">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="text-sm font-medium text-[var(--color-foreground)]"
                    >
                        {label}
                    </label>
                )}
                <input
                    id={inputId}
                    type={type}
                    ref={ref}
                    className={cn(
                        'flex h-10 w-full rounded-lg border border-[var(--color-input)]',
                        'bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-foreground)]',
                        'placeholder:text-[var(--color-muted-foreground)]',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2',
                        'focus-visible:ring-offset-[var(--color-background)]',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        'transition-shadow',
                        error && 'border-[var(--color-destructive)] focus-visible:ring-[var(--color-destructive)]',
                        className
                    )}
                    style={type === 'date' ? {colorScheme: 'light dark'} : undefined}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${inputId}-error` : undefined}
                    {...props}
                />
                {error && (
                    <p id={`${inputId}-error`} className="text-xs text-[var(--color-destructive)]" role="alert">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
export {Input};
