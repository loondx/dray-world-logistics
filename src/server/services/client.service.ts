import "server-only";

import type { Prisma, RecordStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import type { ClientInput } from "@/features/clients/schemas";
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/server/audit/audit-actions";
import { recordAudit } from "@/server/audit/audit.service";

import { pageArgs, type Paginated } from "./pagination";

export type ClientListItem = {
  id: string;
  companyName: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  stateProvince: string | null;
  status: RecordStatus;
  loadCount: number;
};

export async function listClients(params: {
  q?: string;
  status: RecordStatus;
  page: number;
}): Promise<Paginated<ClientListItem>> {
  const where: Prisma.ClientWhereInput = { status: params.status };
  if (params.q) {
    where.OR = [
      { companyName: { contains: params.q, mode: "insensitive" } },
      { contactName: { contains: params.q, mode: "insensitive" } },
      { email: { contains: params.q, mode: "insensitive" } },
      { phone: { contains: params.q } },
      { city: { contains: params.q, mode: "insensitive" } },
    ];
  }
  const { skip, take, page, pageSize } = pageArgs(params.page);
  const [rows, total] = await Promise.all([
    db.client.findMany({
      where,
      orderBy: { companyName: "asc" },
      skip,
      take,
      select: {
        id: true,
        companyName: true,
        contactName: true,
        phone: true,
        email: true,
        city: true,
        stateProvince: true,
        status: true,
        _count: { select: { loads: true } },
      },
    }),
    db.client.count({ where }),
  ]);
  return {
    items: rows.map(({ _count, ...row }) => ({ ...row, loadCount: _count.loads })),
    total,
    page,
    pageSize,
  };
}

export function getClient(id: string) {
  return db.client.findUnique({ where: { id } });
}

export type ClientOption = {
  id: string;
  companyName: string;
  city: string | null;
  stateProvince: string | null;
};

// Active clients for the load form's searchable picker.
export function listClientOptions(): Promise<ClientOption[]> {
  return db.client.findMany({
    where: { status: "ACTIVE" },
    orderBy: { companyName: "asc" },
    select: { id: true, companyName: true, city: true, stateProvince: true },
  });
}

export function getClientOption(id: string): Promise<ClientOption | null> {
  return db.client.findUnique({
    where: { id },
    select: { id: true, companyName: true, city: true, stateProvince: true },
  });
}

export async function createClient(input: ClientInput, userId: string) {
  return db.$transaction(async (tx) => {
    const client = await tx.client.create({ data: { ...input, createdById: userId } });
    await recordAudit(
      {
        action: AUDIT_ACTIONS.CLIENT_CREATED,
        entityType: AUDIT_ENTITIES.CLIENT,
        entityId: client.id,
        userId,
        metadata: { companyName: client.companyName },
      },
      tx,
    );
    return client;
  });
}

export async function updateClient(id: string, input: ClientInput, userId: string) {
  return db.$transaction(async (tx) => {
    const client = await tx.client.update({ where: { id }, data: input });
    await recordAudit(
      { action: AUDIT_ACTIONS.CLIENT_UPDATED, entityType: AUDIT_ENTITIES.CLIENT, entityId: id, userId },
      tx,
    );
    return client;
  });
}

export async function setClientStatus(id: string, status: RecordStatus, userId: string) {
  return db.$transaction(async (tx) => {
    await tx.client.update({ where: { id }, data: { status } });
    await recordAudit(
      {
        action: status === "ARCHIVED" ? AUDIT_ACTIONS.CLIENT_ARCHIVED : AUDIT_ACTIONS.CLIENT_UPDATED,
        entityType: AUDIT_ENTITIES.CLIENT,
        entityId: id,
        userId,
        metadata: { status },
      },
      tx,
    );
  });
}
