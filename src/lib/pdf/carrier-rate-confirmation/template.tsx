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
import type { CarrierRateConfirmationDTO } from "../types";

// Layout only — every value comes pre-formatted from the DTO mapping.
export function CarrierRateConfirmationTemplate({ data }: { data: CarrierRateConfirmationDTO }) {
  return (
    <PdfPage meta={data.meta} companyName={data.company.name}>
      <PdfHeader company={data.company} title={data.meta.title} summary={data.summary} />

      <PdfSection title="Carrier Information">
        <PdfPartyBlock party={data.carrier} extra={data.driver} />
      </PdfSection>

      <PdfSection title="Stops / Actions">
        <PdfStopsTable stops={data.stops} />
      </PdfSection>

      <PdfSection title="Pay Items">
        <PdfPayItems items={data.payItems} total={data.total} />
      </PdfSection>

      <PdfParagraph label="Special Instructions" text={data.specialInstructions} />
      <PdfTerms terms={data.terms} />

      {data.contactLine ? (
        <View style={{ marginTop: 10 }}>
          <Text>{data.contactLine}</Text>
        </View>
      ) : null}

      <PdfSignatureBlock
        title="Carrier Acceptance"
        rows={[
          [
            { label: "Driver Name", width: "50%" },
            { label: "Driver Cell Phone #", width: "50%" },
          ],
          [
            { label: "Print Name", width: "45%" },
            { label: "Signature", width: "40%" },
            { label: "Date", width: "15%" },
          ],
        ]}
      />
      <Text style={[pdf.muted, { fontSize: 7.5, marginTop: 2 }]}>
        By signing, the carrier accepts this load at the rate and terms stated above.
      </Text>
    </PdfPage>
  );
}
