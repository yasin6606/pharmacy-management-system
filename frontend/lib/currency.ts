/** Iranian Rial formatting helpers (no decimals in everyday retail). */

const irrFormatter = new Intl.NumberFormat('fa-IR', {
    style: 'decimal',
    maximumFractionDigits: 0,
});

const irrFormatterEn = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    maximumFractionDigits: 0,
});

export function formatIRR(amount: number | string | null | undefined, locale: 'fa' | 'en' = 'en'): string {
    const n = Number(amount ?? 0);
    if (!Number.isFinite(n)) return locale === 'fa' ? '۰ ریال' : '0 IRR';
    const body = locale === 'fa' ? irrFormatter.format(n) : irrFormatterEn.format(n);
    return locale === 'fa' ? `${body} ریال` : `${body} IRR`;
}

export function formatIRRCompact(amount: number | string | null | undefined): string {
    const n = Number(amount ?? 0);
    if (!Number.isFinite(n)) return '0';
    return irrFormatterEn.format(n);
}
