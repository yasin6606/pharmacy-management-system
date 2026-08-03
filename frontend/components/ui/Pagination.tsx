// components/ui/Pagination.tsx
'use client';
import {useTranslations} from 'next-intl';
import {Button} from './Button';
import {ChevronLeft, ChevronRight} from 'lucide-react';

interface Props {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export function Pagination({page, totalPages, onPageChange}: Props) {
    const t = useTranslations('common');
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between mt-4">
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
            >
                <ChevronLeft className="h-4 w-4"/>
                {t('previous')}
            </Button>
            <span className="text-xs sm:text-sm text-muted-foreground">
        {page} / {totalPages}
      </span>
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
            >
                {t('next')}
                <ChevronRight className="h-4 w-4"/>
            </Button>
        </div>
    );
}
