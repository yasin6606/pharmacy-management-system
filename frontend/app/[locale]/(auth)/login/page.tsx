'use client';

import { LoginForm } from '@/components/forms/LoginForm';
import { Link } from '@/navigation';
import { useTranslations } from 'next-intl';

export default function LoginPage() {
    const t = useTranslations('auth');

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="w-full max-w-md p-6 sm:p-8 bg-card rounded-lg shadow-md border border-border">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 text-foreground text-center">
                    {t('login')}
                </h1>
                <LoginForm />
                <p className="mt-4 sm:mt-6 text-xs sm:text-sm text-center text-muted-foreground">
                    {t('firstTime')}{' '}
                    <Link href="/setup" className="text-primary hover:underline">
                        {t('setup')}
                    </Link>
                </p>
            </div>
        </div>
    );
}
