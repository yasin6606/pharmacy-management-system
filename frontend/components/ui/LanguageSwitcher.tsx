'use client';
import {usePathname, useRouter} from '@/navigation';
import {Select} from './Select';
import {useLocale} from 'next-intl';

export function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const options = [
        {value: 'en', label: 'English'},
        {value: 'fa', label: 'فارسی'},
    ];

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        // pathname is a typed route pattern, but `router.replace` accepts it
        // We cast to `any` to avoid union type conflict while preserving correct locale switching
        router.replace(pathname as any, {locale: e.target.value});
    };

    return (
        <Select
            options={options}
            value={locale}
            onChange={handleChange}
            className="w-28"
        />
    );
}
