import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type ResolvedTheme = 'light' | 'dark';

/**
 * Whichever theme is actually painted on screen right now — never 'system'.
 *
 * `useAppearance` owns the *preference* and writes the `dark` class onto
 * <html>. This reads that result back out, for the handful of things that
 * cannot express themselves as a `dark:` utility: Chart.js draws to a canvas
 * and needs real colour strings at render time.
 */
const ResolvedThemeContext = createContext<ResolvedTheme>('light');

const readTheme = (): ResolvedTheme => {
    if (typeof document === 'undefined') {
        return 'light';
    }

    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
};

export function ThemeProvider({ children }: { children: ReactNode }) {
    // Starts light so the server render and the first client render agree; the
    // effect below corrects it before paint if the blade template stamped
    // `dark` on <html>.
    const [theme, setTheme] = useState<ResolvedTheme>('light');

    useEffect(() => {
        setTheme(readTheme());

        // Catches every route to the class: the appearance toggle, the inline
        // blade script, and the OS switching under a 'system' preference.
        const observer = new MutationObserver(() => setTheme(readTheme()));

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });

        return () => observer.disconnect();
    }, []);

    return <ResolvedThemeContext.Provider value={theme}>{children}</ResolvedThemeContext.Provider>;
}

export function useResolvedTheme(): ResolvedTheme {
    return useContext(ResolvedThemeContext);
}

/**
 * Chart colours as literal rgb/hex rather than the `oklch()` design tokens,
 * because Chart.js parses these strings itself to derive hover and fill
 * variants and does not understand oklch.
 */
const chartPalettes = {
    light: {
        tick: '#52525b',
        grid: 'rgba(0, 0, 0, 0.08)',
        border: 'rgba(0, 0, 0, 0.12)',
        tooltipBackground: 'rgba(24, 24, 27, 0.92)',
        tooltipText: '#fafafa',
    },
    dark: {
        tick: '#a1a1aa',
        grid: 'rgba(255, 255, 255, 0.10)',
        border: 'rgba(255, 255, 255, 0.16)',
        tooltipBackground: 'rgba(250, 250, 250, 0.92)',
        tooltipText: '#18181b',
    },
} as const;

export type ChartPalette = (typeof chartPalettes)[ResolvedTheme];

export function useChartPalette(): ChartPalette {
    const theme = useResolvedTheme();

    return useMemo(() => chartPalettes[theme], [theme]);
}
