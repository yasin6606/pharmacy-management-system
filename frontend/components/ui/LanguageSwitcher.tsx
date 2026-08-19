'use client';
import {usePathname, useRouter} from '@/navigation';
import {Select} from './Select';
import {useLocale} from 'next-intl';
import {Languages} from 'lucide-react';

export function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const options = [
        {value: 'en', label: 'English'},
        {value: 'fa', label: 'فارسی'},
    ];

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        router.replace(pathname as any, {locale: e.target.value});
    };

    return (
        <div className="flex items-center gap-1.5" title="Language / زبان">
            <Languages
                className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]"
                aria-hidden
            />
            <Select
                options={options}
                value={locale}
                onChange={handleChange}
                className="w-28"
                aria-label="Select language"
            />
        </div>
    );
}
