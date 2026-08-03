// next.config.ts
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig = {
    // This empty object provides the space next-intl needs to work with Turbopack
    turbopack: {},
};

export default withNextIntl(nextConfig);
