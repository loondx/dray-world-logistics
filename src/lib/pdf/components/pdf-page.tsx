import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { ReactNode } from "react";

import { PAGE_MARGIN, PAGE_WIDTH, PDF_COLORS, pdf } from "../styles";
import type { PdfDocumentMeta } from "../types";

// US Letter page with the standard footer: "Page X out of Y | Load #N | Company".
export function PdfPage({
  meta,
  companyName,
  children,
}: {
  meta: PdfDocumentMeta;
  companyName: string;
  children: ReactNode;
}) {
  return (
    <Document
      title={`${meta.title} - Load #${meta.loadNumber}`}
      author={companyName}
      creator={companyName}
      producer={companyName}
      subject={`Load #${meta.loadNumber}`}
    >
      <Page size="LETTER" style={pdf.page}>
        {children}
        <View
          fixed
          style={{
            position: "absolute",
            bottom: PAGE_MARGIN - 8,
            left: PAGE_MARGIN,
            width: PAGE_WIDTH - PAGE_MARGIN * 2,
            flexDirection: "row",
            justifyContent: "space-between",
            borderTopWidth: 0.5,
            borderTopColor: PDF_COLORS.border,
            paddingTop: 4,
            fontSize: 7.5,
            color: PDF_COLORS.muted,
          }}
        >
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} out of ${totalPages}`} />
          <Text>Load #{meta.loadNumber}</Text>
          <Text>{companyName}</Text>
        </View>
      </Page>
    </Document>
  );
}
