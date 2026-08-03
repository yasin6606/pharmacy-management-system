import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {ThemeProvider} from '@/components/providers/ThemeProvider';
import {AuthProvider} from '@/context/AuthContext';
import {ErrorProvider} from '@/context/ErrorContext';
import {ErrorToast} from '@/components/ui/ErrorToast';
import {locales} from '@/navigation';
import './globals.css';

export default async function LocaleLayout({
                                               children,
                                               params,
                                           }: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const {locale} = await params;
    if (!locales.includes(locale as any)) notFound();

    // ✅ Explicitly pass locale to getMessages
    const messages = await getMessages({locale});
    const isRTL = locale === 'fa';

    return (
        <html lang={locale} dir={isRTL ? 'rtl' : 'ltr'} suppressHydrationWarning>
        <body className="font-sans antialiased" suppressHydrationWarning>
        <NextIntlClientProvider locale={locale} messages={messages}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                <ErrorProvider>
                    <AuthProvider>
                        {children}
                        <ErrorToast/>
                    </AuthProvider>
                </ErrorProvider>
            </ThemeProvider>
        </NextIntlClientProvider>
        </body>
        </html>
    );
}
