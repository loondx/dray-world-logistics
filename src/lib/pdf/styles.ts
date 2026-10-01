import { StyleSheet } from "@react-pdf/renderer";

// Single visual system shared by every generated document (US Letter, Helvetica).
export const PDF_COLORS = {
  ink: "#111827",
  muted: "#4b5563",
  navy: "#12305f",
  rule: "#1f2937",
  border: "#6b7280",
  fill: "#f3f5f8",
} as const;

export const PAGE_MARGIN = 36;
// US Letter in PDF points.
export const PAGE_WIDTH = 612;

export const pdf = StyleSheet.create({
  page: {
    paddingTop: PAGE_MARGIN,
    paddingBottom: PAGE_MARGIN + 24,
    paddingHorizontal: PAGE_MARGIN,
    fontFamily: "Helvetica",
    fontSize: 8.5,
    color: PDF_COLORS.ink,
    // No page-level lineHeight: react-pdf 4.x drops fixed dynamic `render` text (the
    // "Page X out of Y" footer) when the Page sets one. Set it per Text where needed.
  },

  row: { flexDirection: "row" },
  bold: { fontFamily: "Helvetica-Bold" },
  muted: { color: PDF_COLORS.muted },

  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: PDF_COLORS.ink,
    paddingBottom: 2,
    borderBottomWidth: 1.25,
    borderBottomColor: PDF_COLORS.rule,
    marginBottom: 5,
  },
  section: { marginTop: 10 },

  box: { borderWidth: 0.75, borderColor: PDF_COLORS.border },
  cell: { paddingVertical: 4, paddingHorizontal: 5 },
  tableHeader: {
    flexDirection: "row",
    fontFamily: "Helvetica-Bold",
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.rule,
    paddingBottom: 2,
    marginBottom: 3,
  },
});
