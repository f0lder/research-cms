import { StyleSheet } from 'react-native';

// Default theme colors (fallback)
const defaultTheme = {
  primaryColor:     '#3B82F6',
  secondaryColor:   '#6366F1',
  accentColor:      '#EC4899',
  backgroundColor:  '#FFFFFF',
  textColor:        '#1F2937',
  borderColor:      '#E5E7EB',
  headerBg:         '#3B82F6',
  menuBg:           '#FFFFFF',
  headerTextColor:  '#1F2937',
  footerBg:         '#1F2937',
  footerTextColor:  '#FFFFFF',
  drawerBg:         '#1F2937',
  drawerText:       '#d4d4d8',
  drawerActive:     '#374151',
  borderRadius:     8,
  borderWidth:      1,
};

// Create colors from theme settings
export function createColors(settings: Record<string, unknown>) {
  const primary = String(settings['client.theme.primaryColor'] ?? defaultTheme.primaryColor);
  const secondary = String(settings['client.theme.secondaryColor'] ?? defaultTheme.secondaryColor);
  const accent = String(settings['client.theme.accentColor'] ?? defaultTheme.accentColor);
  const bg = String(settings['client.theme.backgroundColor'] ?? defaultTheme.backgroundColor);
  const text = String(settings['client.theme.textColor'] ?? defaultTheme.textColor);
  const border = String(settings['client.theme.borderColor'] ?? defaultTheme.borderColor);
  const headerBg = String(settings['client.theme.headerBg'] ?? defaultTheme.headerBg);
  const menuBg = String(settings['client.theme.menuBg'] ?? defaultTheme.menuBg);
  const headerTextColor = String(settings['client.theme.headerTextColor'] ?? defaultTheme.headerTextColor);
  const footerBg = String(settings['client.theme.footerBg'] ?? defaultTheme.footerBg);
  const footerTextColor = String(settings['client.theme.footerTextColor'] ?? defaultTheme.footerTextColor);
  const drawerBg = String(settings['client.theme.drawerBg'] ?? defaultTheme.drawerBg);
  const drawerText = String(settings['client.theme.drawerText'] ?? defaultTheme.drawerText);
  const drawerActive = String(settings['client.theme.drawerActive'] ?? defaultTheme.drawerActive);

  return {
    bg,
    headerBg,
    menuBg,
    headerTextColor,
    headerText:   headerTextColor,
    primary,
    secondary,
    accent,
    border,
    text,
    subText:      adjustAlpha(text, 0.6),
    metaText:     adjustAlpha(text, 0.4),
    cardBg:       bg,
    drawerBg,
    drawerText,
    drawerActive,
    footerBg,
    footerTextColor,
  };
}

// Default colors for initial app render
export const C = createColors({
  'client.theme.primaryColor':     defaultTheme.primaryColor,
  'client.theme.secondaryColor':   defaultTheme.secondaryColor,
  'client.theme.accentColor':      defaultTheme.accentColor,
  'client.theme.backgroundColor':  defaultTheme.backgroundColor,
  'client.theme.textColor':        defaultTheme.textColor,
  'client.theme.borderColor':      defaultTheme.borderColor,
  'client.theme.headerBg':         defaultTheme.headerBg,
  'client.theme.menuBg':           defaultTheme.menuBg,
  'client.theme.headerTextColor':  defaultTheme.headerTextColor,
  'client.theme.footerBg':         defaultTheme.footerBg,
  'client.theme.footerTextColor':  defaultTheme.footerTextColor,
  'client.theme.drawerBg':         defaultTheme.drawerBg,
  'client.theme.drawerText':       defaultTheme.drawerText,
  'client.theme.drawerActive':     defaultTheme.drawerActive,
});

// Adjust color opacity (simple implementation for hex colors with alpha)
function adjustAlpha(hex: string, opacity: number): string {
  if (!hex.startsWith('#') || hex.length !== 7) return hex;
  const alpha = Math.round(opacity * 255).toString(16).padStart(2, '0');
  return hex + alpha;
}

export const shared = StyleSheet.create({
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  empty:     { padding: 32, textAlign: 'center', color: C.subText, fontSize: 14 },
  errorText: { color: '#ef4444', fontSize: 14, textAlign: 'center', padding: 16 },
  retryBtn:  { marginTop: 12, paddingHorizontal: 20, paddingVertical: 8, backgroundColor: C.accent, borderRadius: 4 },
  retryText: { color: '#fff', fontSize: 14 },
});
