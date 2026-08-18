'use client';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {useTranslations} from 'next-intl';
import {Input} from '../ui/Input';
import {Button} from '../ui/Button';
import {useAuth} from '@/context/AuthContext';
import {useState} from 'react';
import {ApiError} from '@/lib/api';

export function LoginForm() {
    const t = useTranslations('auth');
    const c = useTranslations('common');
    const m = useTranslations('messages');

    const {login} = useAuth();
    const [error, setError] = useState('');

    const schema = z.object({
        email: z.string().email(t('email')),
        password: z.string().min(6),
    });
    type FormData = z.infer<typeof schema>;

    const {register, handleSubmit, formState: {errors, isSubmitting}} = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormData) => {
        try {
            setError('');
            await login(data.email, data.password);
            // AuthContext already navigates to /dashboard on success
        } catch (err: unknown) {
            if (err instanceof ApiError) {
                setError(err.message || m('error'));
            } else {
                setError(m('error'));
            }
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
                <div className="bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
                    {error}
                </div>
            )}
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
                autoComplete="current-password"
                {...register('password')}
                error={errors.password?.message}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? c('loading') : t('login')}
            </Button>
        </form>
    );
}
