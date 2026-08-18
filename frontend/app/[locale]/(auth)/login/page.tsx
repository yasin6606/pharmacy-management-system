'use client';

import {LoginForm} from '@/components/forms/LoginForm';
import {Link} from '@/navigation';
import {useTranslations} from 'next-intl';
import {Sparkles} from 'lucide-react';

export default function LoginPage() {
    const t = useTranslations('auth');

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden">
            {/* Decorative orbs — pure CSS, no interaction cost */}
            <div
                className="pointer-events-none absolute -top-24 -end-24 h-72 w-72 rounded-full opacity-40 blur-3xl"
                style={{background: 'radial-gradient(circle, var(--color-accent), transparent 70%)'}}
                aria-hidden
            />
            <div
                className="pointer-events-none absolute -bottom-32 -start-16 h-80 w-80 rounded-full opacity-30 blur-3xl"
                style={{background: 'radial-gradient(circle, var(--color-primary), transparent 70%)'}}
                aria-hidden
            />

            <div className="w-full max-w-md fantasy-panel rounded-2xl p-6 sm:p-8 relative z-10">
                <div className="flex flex-col items-center text-center mb-6">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-md mb-3">
                        <Sparkles className="h-6 w-6" aria-hidden />
                    </span>
                    <h1 className="fantasy-title text-2xl sm:text-3xl font-bold text-[var(--color-foreground)]">
                        Arcane Apothecary
                    </h1>
                    <p className="text-sm text-[var(--color-muted-foreground)] mt-1">{t('login')}</p>
                    <div className="fantasy-ornament w-24 mt-4" aria-hidden />
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
