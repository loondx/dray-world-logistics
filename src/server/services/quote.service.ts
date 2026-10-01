import "server-only";

import type { Prisma, QuoteRequestStatus } from "@/generated/prisma/client";
import type { LeadRequestInput } from "@/features/quotes/schemas";
import { db } from "@/lib/db";
import { UserFacingError } from "@/server/errors";

import { pageArgs, type Paginated } from "./pagination";

const MAX_REQUESTS_PER_CONTACT_PER_HOUR = 3;
const HOUR_MS = 60 * 60 * 1000;

// Public website quote request. Throttled per email to limit form abuse.
export async function submitQuoteRequest(input: LeadRequestInput): Promise<void> {
  const since = new Date(Date.now() - HOUR_MS);
  const recent = await db.quoteRequest.count({ where: { email: input.email, createdAt: { gte: since } } });
  if (recent >= MAX_REQUESTS_PER_CONTACT_PER_HOUR) {
    throw new UserFacingError("We already have your recent requests — our team will be in touch shortly.");
  }
  await db.quoteRequest.create({ data: input });
}

export type QuoteListItem = Awaited<ReturnType<typeof db.quoteRequest.findMany>>[number];

export async function listQuoteRequests(params: {
  status?: QuoteRequestStatus;
  page: number;
}): Promise<Paginated<QuoteListItem>> {
  const where: Prisma.QuoteRequestWhereInput = params.status ? { status: params.status } : {};
  const { skip, take, page, pageSize } = pageArgs(params.page);
  const [items, total] = await Promise.all([
    db.quoteRequest.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
    db.quoteRequest.count({ where }),
  ]);
  return { items, total, page, pageSize };
}

export function countNewQuoteRequests(): Promise<number> {
  return db.quoteRequest.count({ where: { status: "NEW" } });
}

export async function setQuoteRequestStatus(id: string, status: QuoteRequestStatus): Promise<void> {
  await db.quoteRequest.update({ where: { id }, data: { status } });
}
