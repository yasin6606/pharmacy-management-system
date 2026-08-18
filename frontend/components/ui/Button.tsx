import {forwardRef} from 'react';
import {cva, type VariantProps} from 'class-variance-authority';
import {cn} from '@/lib/utils';

const buttonVariants = cva(
    [
        'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold',
        'transition-[background,box-shadow,transform,opacity] duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2',
        'focus-visible:ring-offset-[var(--color-background)]',
        'disabled:pointer-events-none disabled:opacity-50',
        'active:scale-[0.98]',
    ].join(' '),
    {
        variants: {
            variant: {
                default: [
                    'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]',
                    'shadow-sm hover:brightness-110',
                    'border border-transparent',
                ].join(' '),
                outline: [
                    'border border-[var(--color-border)]',
                    'bg-[color-mix(in_oklab,var(--color-card)_70%,transparent)]',
                    'backdrop-blur-md',
                    'text-[var(--color-foreground)]',
                    'hover:bg-[var(--color-secondary)] hover:border-[var(--color-primary)]/30',
                ].join(' '),
                ghost: [
                    'text-[var(--color-foreground)]',
                    'hover:bg-[var(--color-secondary)]',
                ].join(' '),
                danger: [
                    'bg-[var(--color-destructive)] text-[var(--color-destructive-foreground)]',
                    'shadow-sm hover:brightness-110',
                ].join(' '),
                accent: [
                    'bg-[var(--color-accent)] text-[var(--color-accent-foreground)]',
                    'shadow-sm hover:brightness-105',
                ].join(' '),
            },
            size: {
                default: 'h-10 px-4 py-2',
                sm: 'h-8 px-3 text-xs rounded-lg',
                lg: 'h-11 px-6 text-base',
                icon: 'h-10 w-10',
            },
        },
        defaultVariants: {variant: 'default', size: 'default'},
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({className, variant, size, ...props}, ref) => (
        <button className={cn(buttonVariants({variant, size, className}))} ref={ref} {...props} />
    )
);
Button.displayName = 'Button';
export {Button, buttonVariants};
