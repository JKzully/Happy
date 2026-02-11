// PDF color palette and sizing constants

export const colors = {
  primary: [30, 64, 175] as const,       // #1E40AF — header banner + table headers
  primaryText: [255, 255, 255] as const,  // white text on primary
  headerBg: [241, 245, 249] as const,     // #F1F5F9 — totals rows
  rowAlt: [248, 250, 252] as const,       // #F8FAFC — striped rows
  text: [15, 23, 42] as const,            // #0F172A — body text
  textDim: [100, 116, 139] as const,      // #64748B — secondary text
  border: [226, 232, 240] as const,       // #E2E8F0 — table lines
};

export const margin = 20; // mm on all sides

export const fontSize = {
  title: 18,
  subtitle: 11,
  sectionTitle: 13,
  tableBody: 9,
  tableHead: 9,
  footer: 8,
};
