import "server-only";

import { db } from "@/lib/db";
import { toBillOfLadingDTO } from "@/lib/pdf/mappings/bill-of-lading";
import { toCarrierRateConfirmationDTO } from "@/lib/pdf/mappings/carrier-rate-confirmation";
import { toInvoiceDTO } from "@/lib/pdf/mappings/invoice";
import type { DocumentContext } from "@/lib/pdf/mappings/common";
import {
  BILL_OF_LADING_SELECT,
  CARRIER_RATE_CONFIRMATION_SELECT,
  INVOICE_SELECT,
  SHIPPER_RATE_CONFIRMATION_SELECT,
} from "@/lib/pdf/mappings/selects";
import { toShipperRateConfirmationDTO } from "@/lib/pdf/mappings/shipper-rate-confirmation";
import type {
  BillOfLadingDTO,
  CarrierRateConfirmationDTO,
  GeneratedDocumentDTO,
  InvoiceDTO,
  ShipperRateConfirmationDTO,
} from "@/lib/pdf/types";
import type { GeneratedDocumentType } from "@/features/documents/document-types";
import { UserFacingError } from "@/server/errors";

// Each builder queries ONLY the fields its document may contain, then maps them.

export async function buildCarrierRateConfirmationDTO(
  loadId: string,
  context: DocumentContext,
): Promise<CarrierRateConfirmationDTO> {
  const load = await db.load.findUnique({ where: { id: loadId }, select: CARRIER_RATE_CONFIRMATION_SELECT });
  if (!load) throw new UserFacingError("This load no longer exists.");
  if (!load.carrier)
    throw new UserFacingError(
      "Assign a carrier to this load before generating the carrier load confirmation.",
    );
  if (load.carrierRate === null)
    throw new UserFacingError("Enter the carrier rate before generating the carrier load confirmation.");
  return toCarrierRateConfirmationDTO(load, context);
}

export async function buildShipperRateConfirmationDTO(
  loadId: string,
  context: DocumentContext,
): Promise<ShipperRateConfirmationDTO> {
  const load = await db.load.findUnique({ where: { id: loadId }, select: SHIPPER_RATE_CONFIRMATION_SELECT });
  if (!load) throw new UserFacingError("This load no longer exists.");
  if (load.clientRate === null)
    throw new UserFacingError("Enter the client rate before generating the client rate confirmation.");
  return toShipperRateConfirmationDTO(load, context);
}

export async function buildBillOfLadingDTO(
  loadId: string,
  context: DocumentContext,
): Promise<BillOfLadingDTO> {
  const load = await db.load.findUnique({ where: { id: loadId }, select: BILL_OF_LADING_SELECT });
  if (!load) throw new UserFacingError("This load no longer exists.");
  return toBillOfLadingDTO(load, context);
}

export async function buildInvoiceDTO(loadId: string, context: DocumentContext): Promise<InvoiceDTO> {
  const load = await db.load.findUnique({ where: { id: loadId }, select: INVOICE_SELECT });
  if (!load) throw new UserFacingError("This load no longer exists.");
  if (load.clientRate === null)
    throw new UserFacingError("Enter the client rate before generating the invoice.");
  return toInvoiceDTO(load, context);
}

export function buildDocumentDTO(
  type: GeneratedDocumentType,
  loadId: string,
  context: DocumentContext,
): Promise<GeneratedDocumentDTO> {
  switch (type) {
    case "CARRIER_RATE_CONFIRMATION":
      return buildCarrierRateConfirmationDTO(loadId, context);
    case "SHIPPER_RATE_CONFIRMATION":
      return buildShipperRateConfirmationDTO(loadId, context);
    case "BOL":
      return buildBillOfLadingDTO(loadId, context);
    case "INVOICE":
      return buildInvoiceDTO(loadId, context);
  }
}
