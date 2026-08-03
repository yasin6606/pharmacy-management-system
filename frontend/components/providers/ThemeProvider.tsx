'use client';

import {ThemeProvider as NextThemesProvider} from 'next-themes';
import React from "react";

// Instead of importing a deep path that may not exist, we define our own minimal type
type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>;

export function ThemeProvider({children, ...props}: ThemeProviderProps) {
    return <NextThemesProvider {...props} enableColorScheme={false}>{children}</NextThemesProvider>;
}
