import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { DocumentSource, DocumentType } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { pageArgs } from "@/server/services/pagination";

export async function listDocuments(params: {
  q?: string;
  type?: DocumentType;
  source?: DocumentSource;
  page: number;
}) {
  const where: Prisma.DocumentWhereInput = { deletedAt: null };
  if (params.type) where.type = params.type;
  if (params.source) where.source = params.source;
  if (params.q) {
    const digits = params.q.replace(/^#/, "");
    where.OR = [
      { originalFilename: { contains: params.q, mode: "insensitive" } },
      { load: { containerNumber: { contains: params.q, mode: "insensitive" } } },
      { load: { client: { companyName: { contains: params.q, mode: "insensitive" } } } },
      ...(/^\d{1,9}$/.test(digits) ? [{ load: { loadNumber: Number(digits) } }] : []),
    ];
  }
  const { skip, take, page, pageSize } = pageArgs(params.page);
  const [items, total] = await Promise.all([
    db.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        type: true,
        source: true,
        version: true,
        originalFilename: true,
        mimeType: true,
        sizeBytes: true,
        notes: true,
        createdAt: true,
        createdById: true,
        load: {
          select: {
            id: true,
            loadNumber: true,
            containerNumber: true,
            client: { select: { companyName: true } },
          },
        },
      },
    }),
    db.document.count({ where }),
  ]);
  return { items, total, page, pageSize };
}

export function listRecentUploads(take = 6) {
  return db.document.findMany({
    where: { deletedAt: null, source: "UPLOADED" },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      type: true,
      originalFilename: true,
      createdAt: true,
      load: { select: { id: true, loadNumber: true } },
    },
  });
}
