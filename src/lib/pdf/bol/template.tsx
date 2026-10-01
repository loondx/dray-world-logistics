import { Text, View } from "@react-pdf/renderer";

import { PdfHeader } from "../components/pdf-header";
import { PdfPage } from "../components/pdf-page";
import {
  PdfParagraph,
  PdfPartyColumns,
  PdfSection,
  PdfSignatureBlock,
  PdfTerms,
} from "../components/pdf-primitives";
import { PdfStopsTable } from "../components/pdf-stops-table";
import { PDF_COLORS, pdf } from "../styles";
import type { BillOfLadingDTO, PdfStop } from "../types";

const rule = { borderTopWidth: 0.75, borderTopColor: PDF_COLORS.border };

// Shipper/consignor signs at pickup, receiver/consignee at delivery; driver initials both.
function StopSignatures({ stop, cargo }: { stop: PdfStop; cargo: string | null }) {
  const party = stop.action === "Pickup" ? "Shipper/Consignor" : "Receiver/Consignee";
  return (
    <View>
      {stop.action === "Pickup" && cargo ? (
        <View style={[pdf.cell, rule]}>
          <Text>
            <Text style={pdf.bold}>Cargo: </Text>
            {cargo}
          </Text>
        </View>
      ) : null}
      <View style={[pdf.row, rule]}>
        <View
          style={[pdf.cell, { width: "80%", borderRightWidth: 0.75, borderRightColor: PDF_COLORS.border }]}
        >
          <Text style={pdf.bold}>{party}</Text>
          <View style={[pdf.row, { marginTop: 16 }]}>
            {[
              ["Print Name", "40%"],
              ["Signature", "40%"],
              ["Date", "20%"],
            ].map(([label, width]) => (
              <View key={label} style={{ width, paddingRight: 6 }}>
                <View style={{ borderBottomWidth: 1, borderBottomColor: PDF_COLORS.rule }} />
                <Text style={{ fontSize: 8 }}>{label}</Text>
              </View>
            ))}
          </View>
          <Text style={{ fontSize: 7.5, marginTop: 3, color: PDF_COLORS.muted }}>
            {stop.action === "Pickup"
              ? "Time in: ________   Time out: ________"
              : "Time in: ________   Time out: ________   Pieces received: ________"}
          </Text>
        </View>
        <View style={[pdf.cell, { width: "20%", justifyContent: "flex-end", alignItems: "center" }]}>
          <Text style={pdf.bold}>Driver Initials</Text>
        </View>
      </View>
    </View>
  );
}

export function BillOfLadingTemplate({ data }: { data: BillOfLadingDTO }) {
  return (
    <PdfPage meta={data.meta} companyName={data.company.name}>
      <PdfHeader company={data.company} title={data.meta.title} summary={data.summary} />

      <PdfPartyColumns
        columns={[
          { title: "Customer Information", party: data.customer },
          { title: "Carrier", party: data.carrier },
        ]}
      />

      <PdfSection title="Stops / Actions">
        <PdfStopsTable
          stops={data.stops}
          renderStopFooter={(stop) => <StopSignatures stop={stop} cargo={data.cargo} />}
        />
      </PdfSection>

      <PdfParagraph label="Special Instructions" text={data.specialInstructions} />
      <PdfParagraph label="Instructions" text={data.instructions} />
      <PdfTerms terms={data.terms} />

      <PdfSignatureBlock
        rows={[
          [
            { label: "Driver / Carrier — Print Name", width: "45%" },
            { label: "Signature", width: "40%" },
            { label: "Date", width: "15%" },
          ],
        ]}
      />
    </PdfPage>
  );
}
