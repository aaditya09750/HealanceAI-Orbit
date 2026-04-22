import React from 'react';
import CombinedReport from './CombinedReport';

const ReportDocument = ({ heartPrediction, symptomsPrediction, user }) => (
  <CombinedReport
    heartPrediction={heartPrediction || null}
    symptomsPrediction={symptomsPrediction || null}
    user={user || {}}
  />
);

export const getReportFilename = (user) => {
  const firstName = String(user?.name || 'patient')
    .trim()
    .split(/\s+/)[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  return `HealanceReport-${firstName || 'patient'}.pdf`;
};

export default ReportDocument;
