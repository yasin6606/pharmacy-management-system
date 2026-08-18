import {cn} from '@/lib/utils';

export const Table = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => (
    <div className="relative overflow-x-auto rounded-xl border border-[var(--color-border)] fantasy-panel">
        <table className={cn('w-full text-start', className)}>{children}</table>
    </div>
);

export const TableHeader = ({children}: {children: React.ReactNode}) => (
    <thead className="bg-[var(--color-secondary)] text-[var(--color-muted-foreground)] border-b border-[var(--color-border)]">
        {children}
    </thead>
);

export const TableBody = ({children}: {children: React.ReactNode}) => (
    <tbody className="divide-y divide-[var(--color-border)]">{children}</tbody>
);

export const TableRow = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => (
    <tr
        className={cn(
            'transition-colors hover:bg-[var(--color-muted)]/60 data-[state=selected]:bg-[var(--color-muted)]',
            className
        )}
    >
        {children}
    </tr>
);

export const TableHead = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => (
    <th
        className={cn(
            'px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wide sm:text-sm sm:px-4 sm:py-3',
            className
        )}
    >
        {children}
    </th>
);

export const TableCell = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => (
    <td className={cn('px-3 py-2.5 text-xs sm:text-sm sm:px-4 sm:py-3', className)}>{children}</td>
);
