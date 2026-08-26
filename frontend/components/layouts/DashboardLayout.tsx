/**
 * Legacy layout shell — the App Router dashboard layout lives in
 * `app/[locale]/(dashboard)/layout.tsx`. This file remains as a thin
 * re-export target so old imports do not resolve to an empty module.
 */
export function DashboardLayout({children}: {children: React.ReactNode}) {
    return <>{children}</>;
}

export default DashboardLayout;
