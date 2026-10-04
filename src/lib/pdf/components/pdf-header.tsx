// Aliased: this is react-pdf's image primitive, not an HTML <img> (no alt attribute exists in PDF output).
import { Image as PdfImage, Text, View } from "@react-pdf/renderer";

import { PDF_COLORS, pdf } from "../styles";
import type { PdfCompany, PdfField } from "../types";

const LOGO_WIDTH = 96;
const LOGO_HEIGHT = 60;

// Letterhead. Left: logo beside the company identity (name, address, MC/DOT, contact).
// Right: document title and key facts — same arrangement as the reference documents.
// A navy rule with a cyan accent (logo colours) separates it from the body.
export function PdfHeader({
  company,
  title,
  summary,
}: {
  company: PdfCompany;
  title: string;
  summary: PdfField[];
}) {
  const contact = [company.phone ? `Phone: ${company.phone}` : null, company.email].filter(Boolean);

  return (
    <View>
      <View style={[pdf.row, { alignItems: "flex-start" }]}>
        <View style={[pdf.row, { width: "56%", alignItems: "flex-start", paddingRight: 12 }]}>
          {company.logo ? (
            <PdfImage
              src={company.logo}
              style={{
                width: LOGO_WIDTH,
                maxHeight: LOGO_HEIGHT,
                objectFit: "contain",
                objectPosition: "left top",
                marginRight: 10,
              }}
            />
          ) : null}
          <View style={{ flex: 1 }}>
            <Text
              style={[
                pdf.bold,
                {
                  fontSize: company.logo ? 12.5 : 16,
                  lineHeight: 1.15,
                  color: PDF_COLORS.navy,
                  marginBottom: 3,
                },
              ]}
            >
              {company.name}
            </Text>
            {company.addressLines.map((line) => (
              <Text key={line} style={{ fontSize: 9, lineHeight: 1.3 }}>
                {line}
              </Text>
            ))}
            {company.mcNumber || company.dotNumber ? (
              <Text style={{ fontSize: 9, lineHeight: 1.3, marginTop: 2 }}>
                {company.mcNumber ? (
                  <>
                    <Text style={pdf.bold}>MC: </Text>
                    {company.mcNumber}
                    {company.dotNumber ? "   " : ""}
                  </>
                ) : null}
                {company.dotNumber ? (
                  <>
                    <Text style={pdf.bold}>DOT: </Text>
                    {company.dotNumber}
                  </>
                ) : null}
              </Text>
            ) : null}
            {contact.length ? (
              <Text style={{ fontSize: 9, lineHeight: 1.3, color: PDF_COLORS.muted }}>
                {contact.join("  ·  ")}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={{ width: "44%" }}>
          <Text
            style={[pdf.bold, { fontSize: 14, color: PDF_COLORS.navy, textAlign: "right", marginBottom: 6 }]}
          >
            {title}
          </Text>
          {summary.map((field) => (
            <View key={field.label} style={[pdf.row, { marginBottom: 2 }]}>
              <Text style={[pdf.bold, { width: "45%", textAlign: "right", paddingRight: 8, fontSize: 9 }]}>
                {field.label}
              </Text>
              <Text style={{ width: "55%", fontSize: 9 }}>{field.value}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[pdf.row, { marginTop: 8 }]}>
        <View style={{ width: "22%", height: 2.5, backgroundColor: PDF_COLORS.cyan }} />
        <View style={{ width: "78%", height: 2.5, backgroundColor: PDF_COLORS.navy }} />
      </View>
    </View>
  );
}
