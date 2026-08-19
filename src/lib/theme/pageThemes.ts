// Per-page theme tokens, ported from the PHP app's bespoke per-page palettes
// (Ember Glass / Minimalista Industrial / Sello y Folio / Glassmorphism con
// neón / Línea de tiempo forense). AppShell looks up the current route's
// first segment and applies these as CSS custom properties on its wrapper,
// so the shared sidebar/topbar chrome recolors per page without needing a
// separate copy of the shell per theme.

export interface ThemeTokens {
  bg: string;
  accent: string;
  accent2: string;
  font: "fraunces" | "inter" | "archivo";
}

const PAGE_THEMES: Record<string, ThemeTokens> = {
  dashboard: { bg: "#0B0708", accent: "#FF8A3D", accent2: "#E54818", font: "fraunces" },
  cotizaciones: { bg: "#0d0d0f", accent: "#F57B02", accent2: "#E2471B", font: "fraunces" },
  precios: { bg: "#0a0a0c", accent: "#ff8c1a", accent2: "#e5432a", font: "inter" },
  "precios/comparar": { bg: "#0d0d0d", accent: "#f57b02", accent2: "#e5432a", font: "inter" }, // "Obsidiana"
  seguimiento: { bg: "#0D0A14", accent: "#F57B02", accent2: "#E2471B", font: "fraunces" },
  auditoria: { bg: "#080808", accent: "#F67C01", accent2: "#E54818", font: "archivo" },
};

const DEFAULT_THEME: ThemeTokens = PAGE_THEMES.dashboard;

export function themeForPathname(pathname: string): ThemeTokens {
  const segments = pathname.split("/").filter(Boolean);
  const twoSegmentKey = segments.slice(0, 2).join("/");
  return PAGE_THEMES[twoSegmentKey] ?? PAGE_THEMES[segments[0] ?? "dashboard"] ?? DEFAULT_THEME;
}
