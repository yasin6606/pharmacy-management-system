'use client';     // ← important for useId
import {forwardRef, SelectHTMLAttributes, useId} from 'react';
import {cn} from '@/lib/utils';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    options: { value: string; label: string }[];
    error?: string;
    label?: string;
    placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({className, options, error, label, id, ...props}, ref) => {
        const generatedId = useId();
        const selectId = id || generatedId;

        return (
            <div className="space-y-1">
                {label && (
                    <label htmlFor={selectId} className="text-sm font-medium text-foreground">
                        {label}
                    </label>
                )}
                <select
                    id={selectId}
                    ref={ref}
                    className={cn(
                        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        error && 'border-red-500 focus-visible:ring-red-500',
                        className
                    )}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${selectId}-error` : undefined}
                    {...props}
                >
                    <option value="" disabled hidden>
                        {props.placeholder || 'Select...'}
                    </option>
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                {error && (
                    <p id={`${selectId}-error`} className="text-xs text-red-500 dark:text-red-400">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

Select.displayName = 'Select';
export {Select};
