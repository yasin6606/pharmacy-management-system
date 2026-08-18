import {forwardRef} from 'react';
import {cva, type VariantProps} from 'class-variance-authority';
import {cn} from '@/lib/utils';

const buttonVariants = cva(
    [
        'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold',
        'transition-all duration-200',
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
                    'hover:brightness-110 shadow-sm',
                    'border border-transparent',
                ].join(' '),
                outline: [
                    'border border-[var(--color-border)] bg-[var(--color-card)]',
                    'text-[var(--color-foreground)]',
                    'hover:border-[var(--color-accent)] hover:bg-[var(--color-secondary)]',
                ].join(' '),
                ghost: 'hover:bg-[var(--color-secondary)] text-[var(--color-foreground)]',
                danger: [
                    'bg-[var(--color-destructive)] text-[var(--color-destructive-foreground)]',
                    'hover:brightness-110 shadow-sm',
                ].join(' '),
                accent: [
                    'bg-[var(--color-accent)] text-[var(--color-accent-foreground)]',
                    'hover:brightness-105 shadow-sm font-bold',
                ].join(' '),
            },
            size: {
                default: 'h-10 px-4 py-2',
                sm: 'h-8 px-3 text-xs',
                lg: 'h-12 px-6 text-base',
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
