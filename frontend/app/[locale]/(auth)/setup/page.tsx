'use client';

import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {useTranslations} from 'next-intl';
import {Input} from '@/components/ui/Input';
import {Button} from '@/components/ui/Button';
import {apiPost, ApiError} from '@/lib/api';
import {useRouter} from '@/navigation';
import {useState} from 'react';
import {Sparkles} from 'lucide-react';

const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    fullName: z.string().min(1),
});

type FormData = z.infer<typeof schema>;

export default function SetupPage() {
    const t = useTranslations('auth');
    const commonT = useTranslations('common');
    const msgT = useTranslations('messages');

    const router = useRouter();
    const [error, setError] = useState('');

    const {
        register,
        handleSubmit,
        formState: {errors, isSubmitting},
    } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormData) => {
        try {
            await apiPost<unknown>('/setup', data);
            router.push('/login');
        } catch (err: unknown) {
            if (err instanceof ApiError) {
                setError(err.message || msgT('error'));
            } else {
                setError(msgT('error'));
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-md fantasy-panel rounded-2xl p-6 sm:p-8">
                <div className="flex flex-col items-center text-center mb-6">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-accent)] text-[var(--color-accent-foreground)] shadow-md mb-3">
                        <Sparkles className="h-6 w-6" aria-hidden />
                    </span>
                    <h1 className="fantasy-title text-2xl sm:text-3xl font-bold text-[var(--color-foreground)]">
                        {t('setup')}
                    </h1>
                    <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
                        Arcane Apothecary · first steward
                    </p>
                    <div className="fantasy-ornament w-24 mt-4" aria-hidden />
                </div>

                {error && (
                    <div
                        className="bg-red-50 dark:bg-red-950/40 text-[var(--color-destructive)] p-3 rounded-lg mb-4 text-sm"
                        role="alert"
                    >
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input label={t('fullName')} {...register('fullName')} error={errors.fullName?.message} />
                    <Input
                        label={t('email')}
                        type="email"
                        autoComplete="email"
                        {...register('email')}
                        error={errors.email?.message}
                    />
                    <Input
                        label={t('password')}
                        type="password"
                        autoComplete="new-password"
                        {...register('password')}
                        error={errors.password?.message}
                    />
                    <Button type="submit" variant="accent" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? commonT('loading') : t('createManager')}
                    </Button>
                </form>
            </div>
        </div>
    );
}
