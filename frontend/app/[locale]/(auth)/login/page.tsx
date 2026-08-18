'use client';

import {LoginForm} from '@/components/forms/LoginForm';
import {Link} from '@/navigation';
import {useTranslations} from 'next-intl';
import {Cross} from 'lucide-react';

export default function LoginPage() {
    const t = useTranslations('auth');

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-md glass-strong rounded-2xl p-6 sm:p-8">
                <div className="flex flex-col items-center text-center mb-6">
                    <span className="glass-chip text-[var(--color-primary)] mb-3">
                        <Cross className="h-6 w-6" aria-hidden />
                    </span>
                    <h1 className="page-title text-2xl sm:text-3xl text-[var(--color-foreground)]">Pharmacy MS</h1>
                    <p className="text-sm text-[var(--color-muted-foreground)] mt-1">{t('login')}</p>
                    <div className="glass-divider w-20 mt-4" aria-hidden />
                </div>

                <LoginForm />

                <p className="mt-6 text-xs sm:text-sm text-center text-[var(--color-muted-foreground)]">
                    {t('firstTime')}{' '}
                    <Link
                        href="/setup"
                        className="font-semibold text-[var(--color-primary)] hover:text-[var(--color-accent)] underline-offset-2 hover:underline"
                    >
                        {t('setup')}
                    </Link>
                </p>
            </div>
        </div>
    );
}
