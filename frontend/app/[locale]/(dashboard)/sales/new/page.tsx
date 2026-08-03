// app/[locale]/(dashboard)/sales/new/page.tsx
'use client';
import {useTranslations} from 'next-intl';
import {useRouter} from '@/navigation';
import {SaleForm} from '@/components/forms/SaleForm';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/Card';
import {Button} from '@/components/ui/Button';
import {ArrowLeft} from 'lucide-react';

export default function NewSalePage() {
    const t = useTranslations('sales');
    const router = useRouter();

    return (
        <div className="max-w-2xl mx-auto space-y-6 px-4 sm:px-0">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label={t('back')}>
                    <ArrowLeft className="h-5 w-5"/>
                </Button>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                    {t('newSale')}
                </h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">{t('saleDetails')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <SaleForm onSuccess={() => router.push('/sales')}/>
                </CardContent>
            </Card>
        </div>
    );
}
