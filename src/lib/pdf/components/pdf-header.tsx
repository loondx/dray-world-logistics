// Aliased: this is react-pdf's image primitive, not an HTML <img> (no alt attribute exists in PDF output).
import { Image as PdfImage, Text, View } from "@react-pdf/renderer";

import { PDF_COLORS, pdf } from "../styles";
import type { PdfCompany, PdfField } from "../types";

// Left: company identity (logo or wordmark, address, MC, phone).
// Right: document title and key facts — same arrangement as the reference documents.
export function PdfHeader({
  company,
  title,
  summary,
}: {
  company: PdfCompany;
  title: string;
  summary: PdfField[];
}) {
  return (
    <View style={[pdf.row, { alignItems: "flex-start" }]}>
      <View style={{ width: "52%", alignItems: "center", paddingRight: 12 }}>
        {company.logo ? (
          <PdfImage
            src={company.logo}
            style={{ maxHeight: 64, maxWidth: 230, objectFit: "contain", marginBottom: 4 }}
          />
        ) : null}
        <Text
          style={[
            pdf.bold,
            {
              fontSize: company.logo ? 11 : 17,
              lineHeight: 1.15,
              color: PDF_COLORS.navy,
              textAlign: "center",
              marginBottom: 4,
            },
          ]}
        >
          {company.name}
        </Text>
        {company.addressLines.map((line) => (
          <Text key={line} style={{ fontSize: 10.5, lineHeight: 1.25, textAlign: "center" }}>
            {line}
          </Text>
        ))}
        {company.mcNumber ? (
          <Text style={{ fontSize: 10.5, marginTop: 2 }}>
            <Text style={pdf.bold}>MC: </Text>
            {company.mcNumber}
            {company.dotNumber ? (
              <>
                <Text style={pdf.bold}>{"   "}DOT: </Text>
                {company.dotNumber}
              </>
            ) : null}
          </Text>
        ) : null}
        {company.phone ? (
          <Text style={{ fontSize: 10.5 }}>
            <Text style={pdf.bold}>Phone: </Text>
            {company.phone}
          </Text>
        ) : null}
        {company.email ? (
          <Text style={{ fontSize: 9.5, color: PDF_COLORS.muted }}>{company.email}</Text>
        ) : null}
      </View>

      <View style={{ width: "48%" }}>
        <Text style={[pdf.bold, { fontSize: 14, textAlign: "center", marginBottom: 8 }]}>{title}</Text>
        {summary.map((field) => (
          <View key={field.label} style={[pdf.row, { marginBottom: 2 }]}>
            <Text style={[pdf.bold, { width: "48%", textAlign: "right", paddingRight: 10, fontSize: 9.5 }]}>
              {field.label}
            </Text>
            <Text style={{ width: "52%", fontSize: 9.5 }}>{field.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
