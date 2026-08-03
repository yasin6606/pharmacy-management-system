import {getRequestConfig} from 'next-intl/server';

export default getRequestConfig(async ({requestLocale}) => {
    // Wait for the locale promise to resolve, default to 'en' if not provided
    const locale = await requestLocale || 'en';

    return {
        locale,
        messages: (await import(`../messages/${locale}.json`)).default,
    };
});
