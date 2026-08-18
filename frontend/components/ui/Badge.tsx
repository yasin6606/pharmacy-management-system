'use client';
import {cva, type VariantProps} from 'class-variance-authority';
import {cn} from '@/lib/utils';

const badgeVariants = cva(
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
    {
        variants: {
            variant: {
                default:
                    'border-transparent bg-[var(--color-primary)] text-[var(--color-primary-foreground)]',
                secondary:
                    'border-transparent bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]',
                success:
                    'border-transparent bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
                danger:
                    'border-transparent bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200',
                warning:
                    'border-transparent bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-100',
                outline: 'text-[var(--color-foreground)] border-[var(--color-border)]',
                gold: 'border-transparent bg-[var(--color-accent)] text-[var(--color-accent-foreground)]',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof badgeVariants> {}

function Badge({className, variant, ...props}: BadgeProps) {
    return <div className={cn(badgeVariants({variant}), className)} {...props} />;
}

export {Badge, badgeVariants};
