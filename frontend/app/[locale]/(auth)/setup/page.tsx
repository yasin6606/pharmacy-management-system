'use client';
'use client';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {useTranslations} from 'next-intl';
import {Input} from '@/components/ui/Input';
import {Button} from '@/components/ui/Button';
import {apiPost} from '@/lib/api';
import {useRouter} from '@/navigation';
import {useState} from 'react';

const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    fullName: z.string().min(1),
});

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
    } = useForm({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: any) => {
        try {
            await apiPost<unknown>('/setup', data);
            router.push('/login');
        } catch (err: any) {
            setError(err.response?.data?.message || msgT('error'));
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="w-full max-w-md p-6 sm:p-8 bg-card rounded-lg shadow-md border border-border">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 text-foreground text-center">
                    {t('setup')}
                </h1>

                {error && (
                    <div
                        className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-3 rounded-md mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input
                        label={t('fullName')}
                        {...register('fullName')}
                        error={errors.fullName?.message}
                    />
                    <Input
                        label={t('email')}
                        type="email"
                        {...register('email')}
                        error={errors.email?.message}
                    />
                    <Input
                        label={t('password')}
                        type="password"
                        {...register('password')}
                        error={errors.password?.message}
                    />
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? commonT('loading') : t('createManager')}
                    </Button>
                </form>
            </div>
        </div>
    );
}
