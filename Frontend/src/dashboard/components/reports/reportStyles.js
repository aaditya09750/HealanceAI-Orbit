import { Font, StyleSheet } from '@react-pdf/renderer';

// Register Sora font with 3 weights. Fonts live in /public/fonts/ and are
// served at root path in dev and production. If a font file fails to load,
// @react-pdf/renderer auto-falls back to Helvetica (built into every PDF viewer).
let soraRegistered = false;
try {
  Font.register({
    family: 'Sora',
    fonts: [
      { src: '/fonts/Sora-Regular.ttf', fontWeight: 400 },
      { src: '/fonts/Sora-SemiBold.ttf', fontWeight: 600 },
      { src: '/fonts/Sora-Bold.ttf', fontWeight: 700 },
    ],
  });
  // Disable hyphenation globally (PDFs look cleaner without forced breaks)
  Font.registerHyphenationCallback((word) => [word]);
  soraRegistered = true;
} catch (err) {
  // Fallback to Helvetica is automatic
  soraRegistered = false;
}

export const isSoraRegistered = () => soraRegistered;

// Brand tokens (mirror index.css / tailwind.config.js values)
export const colors = {
  ink: '#0b1030',
  inkSoft: '#1e2344',
  accent: '#506cd7',
  accentDark: '#4753bf',
  lightBg: '#f0f1fc',
  lightBgAlt: '#f7f8ff',
  border: '#e8eaf9',
  muted: '#5f697a',
  mutedSoft: '#6a7283',
  white: '#ffffff',

  // Risk tiers
  riskLow: '#10b981',
  riskModerate: '#f59e0b',
  riskHigh: '#f97316',
  riskCritical: '#ef4444',

  // Light risk backgrounds
  riskLowBg: '#d1fae5',
  riskModerateBg: '#fef3c7',
  riskHighBg: '#ffedd5',
  riskCriticalBg: '#fee2e2',
};

// Map risk tier to color tokens
export const getRiskTier = (overallRisk) => {
  const r = (overallRisk || 'low').toLowerCase();
  if (r === 'critical')
    return { label: 'CRITICAL', color: colors.riskCritical, bg: colors.riskCriticalBg };
  if (r === 'high') return { label: 'HIGH', color: colors.riskHigh, bg: colors.riskHighBg };
  if (r === 'moderate')
    return { label: 'MODERATE', color: colors.riskModerate, bg: colors.riskModerateBg };
  return { label: 'LOW', color: colors.riskLow, bg: colors.riskLowBg };
};

// Map a percentage to a risk tier (for individual metric bars)
export const percentToTier = (pct) => {
  if (typeof pct !== 'number' || !Number.isFinite(pct)) return getRiskTier('low');
  if (pct >= 76) return getRiskTier('critical');
  if (pct >= 51) return getRiskTier('high');
  if (pct >= 26) return getRiskTier('moderate');
  return getRiskTier('low');
};

// Typography
const fontFamily = soraRegistered ? 'Sora' : 'Helvetica';

export const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.white,
    // Extra padding to accommodate the black frame border
    paddingTop: 42,
    paddingBottom: 46,
    paddingHorizontal: 48,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: colors.ink,
    lineHeight: 1.5,
  },

  // Black frame border shown on every page (absolute + fixed)
  pageBorder: {
    position: 'absolute',
    top: 24,
    left: 24,
    right: 24,
    bottom: 24,
    borderWidth: 1.2,
    borderColor: '#000000',
    borderStyle: 'solid',
  },
  // Inner decorative border (thinner, accent color) nested inside the black frame
  pageBorderInner: {
    position: 'absolute',
    top: 30,
    left: 30,
    right: 30,
    bottom: 30,
    borderWidth: 0.5,
    borderColor: '#000000',
    borderStyle: 'solid',
    opacity: 0.25,
  },

  // Header strip
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerBrand: {
    fontFamily,
    fontWeight: 700,
    fontSize: 12,
    color: colors.ink,
  },
  headerMeta: {
    fontSize: 9,
    color: colors.muted,
  },

  // Footer
  footer: {
    position: 'absolute',
    left: 40,
    right: 40,
    bottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: { fontSize: 8, color: colors.muted },
  footerPage: { fontSize: 8, color: colors.muted },

  // Titles
  reportTitle: {
    fontFamily,
    fontWeight: 700,
    fontSize: 22,
    color: colors.ink,
    lineHeight: 1.2,
    marginBottom: 4,
  },
  reportSubtitle: {
    fontSize: 10,
    color: colors.muted,
    marginBottom: 16,
  },

  // Meta block (patient info, date, report id)
  metaBlock: {
    marginBottom: 20,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  metaLabel: {
    fontSize: 9,
    color: colors.muted,
    width: 90,
  },
  metaValue: {
    fontSize: 9,
    color: colors.ink,
    fontFamily,
    fontWeight: 600,
    flex: 1,
  },

  // Section heading (01 │ SECTION NAME)
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 14,
  },
  sectionNumber: {
    fontFamily,
    fontWeight: 700,
    fontSize: 10,
    color: colors.accent,
    marginRight: 8,
    letterSpacing: 1,
  },
  sectionBar: {
    width: 1,
    height: 12,
    backgroundColor: colors.border,
    marginRight: 8,
  },
  sectionTitle: {
    fontFamily,
    fontWeight: 600,
    fontSize: 13,
    color: colors.ink,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Info card (summary / risk card)
  infoCard: {
    backgroundColor: colors.lightBg,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  infoCardHeading: {
    fontSize: 8,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  infoCardValue: {
    fontFamily,
    fontWeight: 700,
    fontSize: 18,
    color: colors.ink,
    marginBottom: 6,
  },
  infoCardDesc: {
    fontSize: 10,
    color: colors.inkSoft,
    lineHeight: 1.5,
  },

  // Data table
  dataTable: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    overflow: 'hidden',
  },
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dataRowLast: {
    flexDirection: 'row',
  },
  dataCell: {
    flex: 1,
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  dataCellLast: {
    flex: 1,
    padding: 8,
  },
  dataLabel: {
    fontSize: 8,
    color: colors.muted,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  dataValue: {
    fontFamily,
    fontWeight: 600,
    fontSize: 11,
    color: colors.ink,
  },

  // Risk bar
  riskBarRow: {
    marginBottom: 12,
  },
  riskBarLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  riskBarName: {
    fontSize: 10,
    color: colors.ink,
    fontFamily,
    fontWeight: 600,
  },
  riskBarValue: {
    fontSize: 10,
    color: colors.ink,
    fontFamily,
    fontWeight: 700,
  },
  riskBarTrack: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  riskBarFill: {
    height: 8,
    borderRadius: 4,
  },

  // Bullet list
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingRight: 8,
  },
  bulletMarker: {
    fontSize: 10,
    color: colors.accent,
    marginRight: 8,
    fontFamily,
    fontWeight: 700,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    color: colors.ink,
    lineHeight: 1.5,
  },
  emptyText: {
    fontSize: 10,
    color: colors.muted,
    fontStyle: 'italic',
    marginBottom: 6,
  },

  // Paragraph
  paragraph: {
    fontSize: 10,
    color: colors.ink,
    lineHeight: 1.55,
    marginBottom: 8,
  },

  // Disclaimer box
  disclaimer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: colors.lightBgAlt,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    borderRadius: 4,
  },
  disclaimerTitle: {
    fontFamily,
    fontWeight: 700,
    fontSize: 9,
    color: colors.ink,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  disclaimerText: {
    fontSize: 8.5,
    color: colors.muted,
    lineHeight: 1.5,
  },

  // Tier tag (small pill)
  tierTag: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  tierTagText: {
    fontFamily,
    fontWeight: 700,
    fontSize: 8,
    letterSpacing: 0.8,
  },

  // Stack helpers
  row: { flexDirection: 'row' },
  col: { flexDirection: 'column' },
  spaceBetween: { justifyContent: 'space-between' },
  mt4: { marginTop: 4 },
  mt8: { marginTop: 8 },
  mt12: { marginTop: 12 },
  mt16: { marginTop: 16 },
  mb4: { marginBottom: 4 },
  mb8: { marginBottom: 8 },
  mb12: { marginBottom: 12 },

  // Diet plan mini-row
  dietRow: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dietLabel: {
    fontFamily,
    fontWeight: 700,
    fontSize: 9,
    color: colors.accent,
    width: 80,
    textTransform: 'uppercase',
  },
  dietText: {
    flex: 1,
    fontSize: 10,
    color: colors.ink,
    lineHeight: 1.5,
  },

  // Workout plan row
  workoutRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  workoutDay: {
    width: 60,
    fontFamily,
    fontWeight: 700,
    fontSize: 9,
    color: colors.accent,
    textTransform: 'uppercase',
  },
  workoutName: {
    flex: 1,
    fontSize: 10,
    color: colors.ink,
  },
  workoutDuration: {
    width: 80,
    fontSize: 9,
    color: colors.muted,
    textAlign: 'right',
  },
});

// Helper: format date for PDF (short form)
export const formatReportDate = (value) => {
  if (!value) return 'N/A';
  try {
    return new Date(value).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'N/A';
  }
};

// Helper: generate a short report id from mongoId
export const makeReportId = (prefix, id) => {
  if (!id) return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
  return `${prefix}-${String(id).slice(-8).toUpperCase()}`;
};

// Helper: safe percentage label
export const safePercent = (value) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.round(value);
};
