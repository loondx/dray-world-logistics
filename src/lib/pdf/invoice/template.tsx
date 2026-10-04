// Aliased: this is react-pdf's image primitive, not an HTML <img> (no alt attribute exists in PDF output).
import { Image as PdfImage, Text, View } from "@react-pdf/renderer";
import type { ReactNode } from "react";

import { registrationLine } from "../components/pdf-header";
import { PdfPage } from "../components/pdf-page";
import { PDF_COLORS, pdf } from "../styles";
import type { InvoiceDTO } from "../types";

// The client invoice has its own, calmer layout: generous white space, one navy accent
// (the amount due), hairline dividers instead of boxes. Built from a DTO that never
// contains carrier data, carrier rate or margin.

const LIGHT = "#f4f6fa";
const HAIRLINE = "#d9dee8";

function Caption({ children }: { children: ReactNode }) {
  return (
    <Text style={{ fontSize: 7, letterSpacing: 1.2, color: PDF_COLORS.muted, marginBottom: 3 }}>
      {children}
    </Text>
  );
}

function MetaCell({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View
      style={{
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 10,
        backgroundColor: strong ? PDF_COLORS.navy : LIGHT,
      }}
    >
      <Text style={{ fontSize: 7, letterSpacing: 1.2, color: strong ? "#c9d3ea" : PDF_COLORS.muted }}>
        {label.toUpperCase()}
      </Text>
      <Text
        style={[
          pdf.bold,
          { marginTop: 3, fontSize: strong ? 13 : 10, color: strong ? "#ffffff" : PDF_COLORS.ink },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

export function InvoiceTemplate({ data }: { data: InvoiceDTO }) {
  const { company } = data;
  const contact = [company.phone, company.email].filter(Boolean).join("  ·  ");
  const registrations = registrationLine(company);

  return (
    <PdfPage
      meta={data.meta}
      companyName={company.name}
      footerNote={<Text style={[pdf.bold, { color: PDF_COLORS.navy }]}>Thank you for your business.</Text>}
    >
      {/* Header: identity left, title right. */}
      <View style={[pdf.row, { justifyContent: "space-between", alignItems: "flex-start" }]}>
        <View style={[pdf.row, { width: "62%", alignItems: "flex-start" }]}>
          {company.logo ? (
            <PdfImage
              src={company.logo}
              style={{
                width: 88,
                maxHeight: 54,
                objectFit: "contain",
                objectPosition: "left top",
                marginRight: 10,
              }}
            />
          ) : null}
          <View style={{ flex: 1 }}>
            <Text style={[pdf.bold, { fontSize: 12, color: PDF_COLORS.navy, marginBottom: 2 }]}>
              {company.name}
            </Text>
            {company.addressLines.map((line) => (
              <Text key={line} style={{ fontSize: 8.5, lineHeight: 1.3, color: PDF_COLORS.muted }}>
                {line}
              </Text>
            ))}
            {contact ? (
              <Text style={{ fontSize: 8.5, lineHeight: 1.3, color: PDF_COLORS.muted }}>{contact}</Text>
            ) : null}
            {registrations ? (
              <Text style={{ fontSize: 8.5, lineHeight: 1.3, color: PDF_COLORS.muted }}>{registrations}</Text>
            ) : null}
          </View>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={[pdf.bold, { fontSize: 26, letterSpacing: 4, color: PDF_COLORS.navy }]}>INVOICE</Text>
          <Text style={{ fontSize: 10, marginTop: 2, color: PDF_COLORS.muted }}>{data.invoiceNumber}</Text>
        </View>
      </View>

      <View
        style={{ height: 2, backgroundColor: PDF_COLORS.cyan, width: 56, marginTop: 14, marginBottom: 14 }}
      />

      {/* Key dates. Each fact appears once on the page; the total is at the end of the charges. */}
      <View style={[pdf.row, { gap: 4 }]}>
        <MetaCell label="Invoice date" value={data.invoiceDate} />
        <MetaCell label="Due date" value={data.dueDate} strong />
      </View>

      {/* Bill to (simple) and shipment. */}
      <View style={[pdf.row, { marginTop: 20 }]} wrap={false}>
        <View style={{ width: "45%", paddingRight: 16 }}>
          <Caption>BILL TO</Caption>
          <Text style={[pdf.bold, { fontSize: 11, marginBottom: 2 }]}>{data.billTo.name}</Text>
          {[...data.billTo.addressLines, ...data.billTo.contactLines].map((line) => (
            <Text key={line} style={{ fontSize: 9, lineHeight: 1.35 }}>
              {line}
            </Text>
          ))}
        </View>
        <View style={{ width: "55%" }}>
          <Caption>SHIPMENT</Caption>
          {data.shipment.map((field) => (
            <View key={field.label} style={[pdf.row, { marginBottom: 1.5 }]}>
              <Text style={{ width: 68, fontSize: 8.5, color: PDF_COLORS.muted }}>{field.label}</Text>
              <Text style={{ flex: 1, fontSize: 8.5 }}>{field.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Charges. */}
      <View style={{ marginTop: 22 }} wrap={false}>
        <View
          style={[
            pdf.row,
            {
              backgroundColor: LIGHT,
              paddingVertical: 6,
              paddingHorizontal: 8,
              borderBottomWidth: 1,
              borderBottomColor: PDF_COLORS.navy,
            },
          ]}
        >
          <Text style={[pdf.bold, { width: "38%", fontSize: 8, letterSpacing: 0.8 }]}>DESCRIPTION</Text>
          <Text style={[pdf.bold, { width: "42%", fontSize: 8, letterSpacing: 0.8 }]}>DETAILS</Text>
          <Text style={[pdf.bold, { width: "20%", fontSize: 8, letterSpacing: 0.8, textAlign: "right" }]}>
            AMOUNT
          </Text>
        </View>
        {data.lines.map((line, index) => (
          <View
            key={index}
            style={[
              pdf.row,
              {
                paddingVertical: 7,
                paddingHorizontal: 8,
                borderBottomWidth: 0.5,
                borderBottomColor: HAIRLINE,
              },
            ]}
          >
            <Text style={[pdf.bold, { width: "38%", fontSize: 9.5 }]}>{line.description}</Text>
            <Text style={{ width: "42%", fontSize: 9, color: PDF_COLORS.muted }}>{line.details}</Text>
            <Text style={{ width: "20%", fontSize: 9.5, textAlign: "right" }}>{line.amount}</Text>
          </View>
        ))}

        <View
          style={[
            pdf.row,
            {
              alignSelf: "flex-end",
              width: "46%",
              marginTop: 10,
              justifyContent: "space-between",
              paddingVertical: 9,
              paddingHorizontal: 10,
              backgroundColor: PDF_COLORS.navy,
            },
          ]}
        >
          <Text style={[pdf.bold, { fontSize: 11, color: "#ffffff" }]}>Total due (USD)</Text>
          <Text style={[pdf.bold, { fontSize: 13, color: "#ffffff" }]}>{data.total}</Text>
        </View>
      </View>

      {/* Payment: the terms in plain words, then how to pay. */}
      <View style={{ marginTop: 20, padding: 12, backgroundColor: LIGHT }} wrap={false}>
        <Caption>PAYMENT</Caption>
        <Text style={{ fontSize: 9.5, lineHeight: 1.35 }}>
          <Text style={pdf.bold}>{data.terms}: </Text>
          {data.termsSentence} All amounts are in US dollars (USD).
        </Text>
        {data.paymentInstructions ? (
          <Text style={{ fontSize: 9, lineHeight: 1.35, marginTop: 6 }}>{data.paymentInstructions}</Text>
        ) : null}
        <Text style={{ fontSize: 8.5, marginTop: 6, color: PDF_COLORS.muted }}>
          Please include the invoice number with your payment.
          {data.businessNumber ? `   Business #: ${data.businessNumber}` : ""}
          {data.dunsNumber ? `   DUNS: ${data.dunsNumber}` : ""}
        </Text>
      </View>

      {data.notes.length ? (
        <View style={{ marginTop: 12 }} wrap={false}>
          <Caption>NOTES</Caption>
          {data.notes.map((note, index) => (
            <Text key={index} style={{ fontSize: 8, lineHeight: 1.35, color: PDF_COLORS.muted }}>
              {note}
            </Text>
          ))}
        </View>
      ) : null}
    </PdfPage>
  );
}
