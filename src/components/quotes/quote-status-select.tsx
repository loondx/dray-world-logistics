"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { NativeSelect } from "@/components/forms/native-select";
import type { QuoteRequestStatus } from "@/generated/prisma/enums";
import { setQuoteStatusAction } from "@/features/quotes/actions";

export const QUOTE_STATUS_LABELS: Record<QuoteRequestStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  CLOSED: "Closed",
};

export function QuoteStatusSelect({ id, status }: { id: string; status: QuoteRequestStatus }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <NativeSelect
      aria-label="Quote request status"
      className="h-8 w-32 text-xs"
      value={status}
      disabled={pending}
      onChange={(event) => {
        const next = event.target.value;
        startTransition(async () => {
          const result = await setQuoteStatusAction(id, next);
          if (result.ok) router.refresh();
          else toast.error(result.message);
        });
      }}
    >
      {Object.entries(QUOTE_STATUS_LABELS).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </NativeSelect>
  );
}
