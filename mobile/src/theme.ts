import { StyleSheet } from 'react-native';

export const C = {
  bg:           '#fafafa',
  headerBg:     '#18181b',
  headerText:   '#ffffff',
  accent:       '#3b82f6',
  border:       '#e4e4e7',
  text:         '#18181b',
  subText:      '#71717a',
  metaText:     '#a1a1aa',
  cardBg:       '#ffffff',
  drawerBg:     '#18181b',
  drawerText:   '#d4d4d8',
  drawerActive: '#3f3f46',
};

export const shared = StyleSheet.create({
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  empty:     { padding: 32, textAlign: 'center', color: C.subText, fontSize: 14 },
  errorText: { color: '#ef4444', fontSize: 14, textAlign: 'center', padding: 16 },
  retryBtn:  { marginTop: 12, paddingHorizontal: 20, paddingVertical: 8, backgroundColor: C.accent, borderRadius: 4 },
  retryText: { color: '#fff', fontSize: 14 },
});
