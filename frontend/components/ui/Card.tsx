import {cn} from '@/lib/utils';

const Card = ({className, ...props}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            'glass rounded-2xl text-[var(--color-card-foreground)]',
            className
        )}
        {...props}
    />
);

const CardHeader = ({className, ...props}: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('flex flex-col space-y-1 p-5 pb-2 sm:p-6 sm:pb-3', className)} {...props} />
);

const CardTitle = ({className, ...props}: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3
        className={cn(
            'page-title text-base sm:text-lg leading-snug tracking-tight text-[var(--color-foreground)]',
            className
        )}
        {...props}
    />
);

const CardDescription = ({className, ...props}: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className={cn('text-sm text-[var(--color-muted-foreground)] leading-relaxed', className)} {...props} />
);

const CardContent = ({className, ...props}: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('p-5 pt-0 sm:p-6 sm:pt-0', className)} {...props} />
);

const CardFooter = ({className, ...props}: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('flex items-center gap-2 p-5 pt-0 sm:p-6 sm:pt-0', className)} {...props} />
);

export {Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent};
