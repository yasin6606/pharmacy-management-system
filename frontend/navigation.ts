import {createNavigation} from 'next-intl/navigation';

export const locales = ['en', 'fa'] as const;
export const localePrefix = 'always';

export const pathnames = {
    '/': '/',
    '/login': '/login',
    '/setup': '/setup',
    '/dashboard': '/dashboard',
    '/inventory': '/inventory',
    '/inventory/drugs/[id]': '/inventory/drugs/[id]',
    '/sales': '/sales',
    '/sales/records': '/sales/records',
    '/sales/new': '/sales/new',
    '/credits': '/credits',
    '/reports': '/reports',
    '/employees': '/employees',
    '/branches': '/branches',
    '/loss-reports': '/loss-reports'
};

export const {Link, redirect, usePathname, useRouter} =
    createNavigation({
        locales,
        pathnames,
        localePrefix,
    });
