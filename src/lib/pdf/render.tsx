import { Font, renderToBuffer } from "@react-pdf/renderer";

import { BillOfLadingTemplate } from "./bol/template";
import { CarrierRateConfirmationTemplate } from "./carrier-rate-confirmation/template";
import { InvoiceTemplate } from "./invoice/template";
import { ShipperRateConfirmationTemplate } from "./shipper-rate-confirmation/template";
import type { GeneratedDocumentDTO } from "./types";

// Never hyphenate: emails, container numbers and references must print intact.
Font.registerHyphenationCallback((word) => [word]);

// DTO → PDF bytes. Templates can change freely without touching load logic.
export function renderPdf(dto: GeneratedDocumentDTO): Promise<Buffer> {
  switch (dto.kind) {
    case "CARRIER_RATE_CONFIRMATION":
      return renderToBuffer(<CarrierRateConfirmationTemplate data={dto} />);
    case "SHIPPER_RATE_CONFIRMATION":
      return renderToBuffer(<ShipperRateConfirmationTemplate data={dto} />);
    case "BOL":
      return renderToBuffer(<BillOfLadingTemplate data={dto} />);
    case "INVOICE":
      return renderToBuffer(<InvoiceTemplate data={dto} />);
  }
}
