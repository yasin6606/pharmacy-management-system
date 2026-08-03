import createMiddleware from 'next-intl/middleware';
import { locales, localePrefix } from './navigation';

export default createMiddleware({
  locales,
  defaultLocale: 'en',
  localePrefix,
});

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
