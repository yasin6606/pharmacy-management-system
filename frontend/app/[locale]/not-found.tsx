import {getTranslations} from 'next-intl/server';
import {Link} from '@/navigation';
import {Button} from '@/components/ui/Button';

export default async function NotFound() {
    const t = await getTranslations('common');

    return (
        <div className="flex h-screen flex-col items-center justify-center bg-background">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold text-foreground">404</h1>
                <h2 className="text-xl text-muted-foreground">{t('notFound')}</h2>
                <Link href="/dashboard">
                    <Button variant="default">{t('back')}</Button>
                </Link>
            </div>
        </div>
    );
}
