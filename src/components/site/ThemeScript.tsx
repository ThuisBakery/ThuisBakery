import { themeScript } from '@/domain/theme'

/**
 * The stored theme choice, applied to the root element while the `<head>` is parsed, so a
 * statically generated page opens in the customer's theme with no flash of the other one
 * (ADR-0007). It belongs in the root layout's `<head>`, whose `<html>` carries
 * `suppressHydrationWarning` because this script changes its attribute before React
 * hydrates. It runs on full page loads only, which is every navigation on this site.
 */
export const ThemeScript = () => <script dangerouslySetInnerHTML={{ __html: themeScript }} />
