import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { styles, colors, percentToTier, getRiskTier, safePercent } from './reportStyles';
import BrandLogo from './BrandLogo';

// Black frame border applied to every page (use with `fixed` inside <Page>)
export const PageFrame = () => (
  <>
    <View style={styles.pageBorder} fixed />
    <View style={styles.pageBorderInner} fixed />
  </>
);

// Page header with brand name + logo + context label
export const ReportHeader = ({ variant = 'default', idSuffix = 'hdr' }) => (
  <View style={styles.header} fixed>
    <View style={styles.headerLeft}>
      <BrandLogo size={20} idSuffix={idSuffix} />
      <Text style={styles.headerBrand}>Healance</Text>
    </View>
    <Text style={styles.headerMeta}>
      {variant === 'cover'
        ? 'Comprehensive Health Report'
        : variant === 'heart'
          ? 'Heart & Diabetes Section'
          : variant === 'symptoms'
            ? 'Symptoms Analysis Section'
            : 'Health Report'}
    </Text>
  </View>
);

// Page footer (fixed at bottom of every page)
export const ReportFooter = () => (
  <View style={styles.footer} fixed>
    <Text style={styles.footerText}>Healance AI · AI-generated · Not a medical diagnosis</Text>
    <Text
      style={styles.footerPage}
      render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
    />
  </View>
);

// Section heading: "01 │ TITLE"
export const SectionHeading = ({ number, title }) => (
  <View style={styles.sectionRow}>
    <Text style={styles.sectionNumber}>{number}</Text>
    <View style={styles.sectionBar} />
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

// Small tier pill (e.g., LOW / HIGH)
export const TierTag = ({ tier }) => (
  <View style={[styles.tierTag, { backgroundColor: tier.bg }]}>
    <Text style={[styles.tierTagText, { color: tier.color }]}>{tier.label}</Text>
  </View>
);

// Info card (summary block with colored background)
export const InfoCard = ({ children, color }) => (
  <View style={[styles.infoCard, color ? { backgroundColor: color } : null]} wrap={false}>
    {children}
  </View>
);

// Risk bar: label + percentage + colored fill
export const RiskBar = ({ name, value }) => {
  const pct = safePercent(value);
  const tier = percentToTier(pct);
  return (
    <View style={styles.riskBarRow} wrap={false}>
      <View style={styles.riskBarLabel}>
        <Text style={styles.riskBarName}>{name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={styles.riskBarValue}>{pct != null ? `${pct}%` : 'N/A'}</Text>
          {pct != null && <TierTag tier={tier} />}
        </View>
      </View>
      <View style={styles.riskBarTrack}>
        {pct != null && (
          <View
            style={[
              styles.riskBarFill,
              {
                width: `${Math.max(2, Math.min(100, pct))}%`,
                backgroundColor: tier.color,
              },
            ]}
          />
        )}
      </View>
    </View>
  );
};

// Bullet list with graceful empty state
export const BulletList = ({ items, emptyText = 'Not available.' }) => {
  const list = Array.isArray(items) ? items.filter(Boolean) : [];
  if (list.length === 0) {
    return <Text style={styles.emptyText}>{emptyText}</Text>;
  }
  return (
    <View>
      {list.map((item, idx) => (
        <View key={idx} style={styles.bulletItem}>
          <Text style={styles.bulletMarker}>▸</Text>
          <Text style={styles.bulletText}>{String(item)}</Text>
        </View>
      ))}
    </View>
  );
};

// Data table: render rows of [{label, value}]; chunked into groups of 3 per row
export const DataTable = ({ items }) => {
  const rows = [];
  for (let i = 0; i < items.length; i += 3) {
    rows.push(items.slice(i, i + 3));
  }
  return (
    <View style={styles.dataTable} wrap={false}>
      {rows.map((row, rIdx) => {
        const isLastRow = rIdx === rows.length - 1;
        // Pad row to 3 cells to keep column widths consistent
        const padded = [...row];
        while (padded.length < 3) padded.push(null);
        return (
          <View key={rIdx} style={isLastRow ? styles.dataRowLast : styles.dataRow}>
            {padded.map((cell, cIdx) => {
              const isLastCell = cIdx === 2;
              const cellStyle = isLastCell ? styles.dataCellLast : styles.dataCell;
              if (!cell) {
                return <View key={cIdx} style={cellStyle} />;
              }
              return (
                <View key={cIdx} style={cellStyle}>
                  <Text style={styles.dataLabel}>{cell.label}</Text>
                  <Text style={styles.dataValue}>{cell.value || 'N/A'}</Text>
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
};

// Meta block: Patient / Report ID / Date rows
export const MetaBlock = ({ rows }) => (
  <View style={styles.metaBlock}>
    {rows.map((r, i) => (
      <View key={i} style={styles.metaRow}>
        <Text style={styles.metaLabel}>{r.label}</Text>
        <Text style={styles.metaValue}>{r.value}</Text>
      </View>
    ))}
  </View>
);

// Disclaimer box
export const Disclaimer = ({ text }) => (
  <View style={styles.disclaimer} wrap={false}>
    <Text style={styles.disclaimerTitle}>Important Disclaimer</Text>
    <Text style={styles.disclaimerText}>{text}</Text>
  </View>
);

// Re-export helpers for convenience
export { getRiskTier, percentToTier, safePercent } from './reportStyles';
