import {cn} from '@/lib/utils';

type AlertProps = {
    children: React.ReactNode;
    variant?: 'info' | 'success' | 'warning' | 'error';
    className?: string;
};

const styles: Record<NonNullable<AlertProps['variant']>, string> = {
    info: 'border-[var(--color-border)] bg-[var(--color-secondary)] text-[var(--color-foreground)]',
    success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200',
    warning: 'border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100',
    error: 'border-red-500/40 bg-red-500/10 text-red-800 dark:text-red-200',
};

/** Lightweight inline alert surface */
export function Alert({children, variant = 'info', className}: AlertProps) {
    return (
        <div
            role="alert"
            className={cn(
                'rounded-xl border px-3 py-2 text-sm glass-subtle',
                styles[variant],
                className
            )}
        >
            {children}
        </div>
    );
}
