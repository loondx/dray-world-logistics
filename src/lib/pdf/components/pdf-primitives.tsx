import { Text, View } from "@react-pdf/renderer";
import type { ReactNode } from "react";

import { PDF_COLORS, pdf } from "../styles";
import type { PdfField, PdfParty } from "../types";

export function PdfSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={pdf.section}>
      <Text style={pdf.sectionTitle} minPresenceAhead={40}>
        {title}
      </Text>
      {children}
    </View>
  );
}

export function PdfLabelValues({ items, labelWidth = 70 }: { items: PdfField[]; labelWidth?: number }) {
  return (
    <View>
      {items.map((item) => (
        <View key={item.label} style={[pdf.row, { marginBottom: 1.5 }]}>
          <Text style={[pdf.bold, { width: labelWidth, textAlign: "right", paddingRight: 6 }]}>
            {item.label}
          </Text>
          <Text style={{ flex: 1 }}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

// Three-column party block: name/address | details | extra details.
export function PdfPartyBlock({ party, extra }: { party: PdfParty; extra?: PdfField[] }) {
  return (
    <View style={pdf.row} wrap={false}>
      <View style={{ width: extra ? "32%" : "36%", paddingRight: 8 }}>
        <Text style={pdf.bold}>{party.name}</Text>
        {party.addressLines.map((line) => (
          <Text key={line}>{line}</Text>
        ))}
        {party.phone ? <Text>{party.phone}</Text> : null}
      </View>
      <View style={{ width: extra ? "42%" : "64%", paddingRight: 6 }}>
        <PdfLabelValues items={party.details} labelWidth={78} />
      </View>
      {extra ? (
        <View style={{ width: "26%" }}>
          <PdfLabelValues items={extra} labelWidth={46} />
        </View>
      ) : null}
    </View>
  );
}

export function PdfParagraph({ label, text }: { label: string; text: string | null }) {
  if (!text) return null;
  return (
    <View style={{ marginTop: 8 }} wrap={false}>
      <Text>
        <Text style={pdf.bold}>{label}: </Text>
        {text}
      </Text>
    </View>
  );
}

export function PdfTerms({ title = "Terms & Conditions :", terms }: { title?: string; terms: string[] }) {
  if (terms.length === 0) return null;
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={[pdf.bold, { fontSize: 9, marginBottom: 4 }]}>{title}</Text>
      {terms.map((term, index) => (
        <View key={index} style={[pdf.row, { paddingLeft: 14, marginBottom: 1.5 }]} wrap={false}>
          <Text style={{ width: 10, fontSize: 8 }}>•</Text>
          <Text style={{ flex: 1, fontSize: 8, lineHeight: 1.25 }}>{term}</Text>
        </View>
      ))}
    </View>
  );
}

// Signature line with a caption underneath.
export function PdfSignatureLine({ label, width }: { label: string; width: string }) {
  return (
    <View style={{ width, paddingRight: 8 }}>
      <View style={{ borderBottomWidth: 1, borderBottomColor: PDF_COLORS.rule, height: 22 }} />
      <Text style={{ fontSize: 9.5, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

export function PdfSignatureBlock({
  title,
  rows,
}: {
  title?: string;
  rows: { label: string; width: string }[][];
}) {
  return (
    <View style={{ marginTop: 14 }} wrap={false}>
      {title ? <Text style={[pdf.bold, { fontSize: 10, marginBottom: 2 }]}>{title}</Text> : null}
      {rows.map((row, index) => (
        <View key={index} style={[pdf.row, { marginBottom: 6 }]}>
          {row.map((line) => (
            <PdfSignatureLine key={line.label} label={line.label} width={line.width} />
          ))}
        </View>
      ))}
    </View>
  );
}
