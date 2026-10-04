import { Text, View } from "@react-pdf/renderer";

import { PdfHeader } from "../components/pdf-header";
import { PdfPage } from "../components/pdf-page";
import { PdfPayItems } from "../components/pdf-pay-items";
import {
  PdfParagraph,
  PdfPartyBlock,
  PdfSection,
  PdfSignatureBlock,
  PdfTerms,
} from "../components/pdf-primitives";
import { PdfStopsTable } from "../components/pdf-stops-table";
import { pdf } from "../styles";
import type { ShipperRateConfirmationDTO } from "../types";

// A separate template (not the carrier one with fields hidden): it is built from a
// DTO that never contains carrier data.
export function ShipperRateConfirmationTemplate({ data }: { data: ShipperRateConfirmationDTO }) {
  return (
    <PdfPage meta={data.meta} companyName={data.company.name}>
      <PdfHeader company={data.company} title={data.meta.title} summary={data.summary} />

      <PdfSection title="Client Information">
        <PdfPartyBlock party={data.client} />
      </PdfSection>

      <PdfSection title="Stops / Actions">
        <PdfStopsTable stops={data.stops} />
      </PdfSection>

      <PdfSection title="Charges">
        <PdfPayItems items={data.payItems} total={data.total} />
      </PdfSection>

      <PdfParagraph label="Special Instructions" text={data.specialInstructions} />
      <PdfParagraph label="Payment Instructions" text={data.paymentInstructions} />
      <PdfTerms terms={data.terms} />

      {data.contactLine ? (
        <View style={{ marginTop: 10 }}>
          <Text>{data.contactLine}</Text>
        </View>
      ) : null}

      <PdfSignatureBlock
        title="Client Acceptance"
        rows={[
          [
            { label: "Print Name", width: "45%" },
            { label: "Signature", width: "40%" },
            { label: "Date", width: "15%" },
          ],
        ]}
      />
      <Text style={[pdf.muted, { fontSize: 7.5, marginTop: 2 }]}>
        Please sign and return to confirm the rate and shipment details above.
      </Text>
    </PdfPage>
  );
}
