import { createContext, useContext } from 'react';

const defaultTheme = {
  primaryColor: '#3B82F6',
  secondaryColor: '#6366F1',
  accentColor: '#EC4899',
  backgroundColor: '#FFFFFF',
  textColor: '#1F2937',
  borderColor: '#E5E7EB',
  borderRadius: 8,
  borderWidth: 1,
};

export type ThemeColors = ReturnType<typeof createColors>;

export function createColors(settings: Record<string, unknown>) {
  const primary = String(settings['client.theme.primaryColor'] ?? defaultTheme.primaryColor);
  const secondary = String(settings['client.theme.secondaryColor'] ?? defaultTheme.secondaryColor);
  const accent = String(settings['client.theme.accentColor'] ?? defaultTheme.accentColor);
  const bg = String(settings['client.theme.backgroundColor'] ?? defaultTheme.backgroundColor);
  const text = String(settings['client.theme.textColor'] ?? defaultTheme.textColor);
  const border = String(settings['client.theme.borderColor'] ?? defaultTheme.borderColor);
  const borderRadius = Number(settings['client.theme.borderRadius'] ?? defaultTheme.borderRadius);
  const borderWidth = Number(settings['client.theme.borderWidth'] ?? defaultTheme.borderWidth);

  return {
    bg,
    primary,
    secondary,
    accent,
    border,
    text,
    subText: adjustAlpha(text, 0.6),
    metaText: adjustAlpha(text, 0.4),
    cardBg: bg,
    borderRadius,
    borderWidth,
  };
}

export const C = createColors({});

const ThemeContext = createContext<ThemeColors>(C);
export const ThemeProvider = ThemeContext.Provider;
export const useTheme = () => useContext(ThemeContext);

export function applyThemeVars(colors: ThemeColors) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--color-primary', colors.primary);
  root.style.setProperty('--color-secondary', colors.secondary);
  root.style.setProperty('--color-accent', colors.accent);
  root.style.setProperty('--color-bg', colors.bg);
  root.style.setProperty('--color-card-bg', colors.cardBg);
  root.style.setProperty('--color-text', colors.text);
  root.style.setProperty('--color-sub-text', colors.subText);
  root.style.setProperty('--color-meta-text', colors.metaText);
  root.style.setProperty('--color-border', colors.border);
  root.style.setProperty('--border-width', `${colors.borderWidth}px`);
  root.style.setProperty('--border-radius', `${colors.borderRadius}px`);
}

// Adjust color opacity for hex colors (#RRGGBB → #RRGGBBAA)
function adjustAlpha(hex: string, opacity: number): string {
  if (!hex.startsWith('#') || hex.length !== 7) return hex;
  const alpha = Math.round(opacity * 255).toString(16).padStart(2, '0');
  return hex + alpha;
}
