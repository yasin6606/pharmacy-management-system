import {cn} from '@/lib/utils';

const Card = ({className, ...props}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            'fantasy-panel rounded-xl text-[var(--color-card-foreground)]',
            className
        )}
        {...props}
    />
);

const CardHeader = ({className, ...props}: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('flex flex-col space-y-1.5 p-6 pb-3', className)} {...props} />
);

const CardTitle = ({className, ...props}: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3
        className={cn(
            'fantasy-title text-lg font-semibold leading-none tracking-tight text-[var(--color-foreground)]',
            className
        )}
        {...props}
    />
);

const CardDescription = ({className, ...props}: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className={cn('text-sm text-[var(--color-muted-foreground)]', className)} {...props} />
);

const CardContent = ({className, ...props}: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('p-6 pt-0', className)} {...props} />
);

const CardFooter = ({className, ...props}: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('flex items-center p-6 pt-0', className)} {...props} />
);

export {Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent};
