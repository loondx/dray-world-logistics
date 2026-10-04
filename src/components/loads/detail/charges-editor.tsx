"use client";

import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useRef } from "react";

import { ConfirmActionButton } from "@/components/dashboard/confirm-action-button";
import { useActionForm } from "@/components/forms/use-action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addLoadChargeAction, removeLoadChargeAction } from "@/features/loads/charge-actions";
import { CHARGE_SUGGESTIONS } from "@/features/loads/charges";

export type ChargeRow = { id: string; description: string; amount: string };

// Extra charges billed to the client (chassis, detention …). Shown on the invoice only.
export function ChargesEditor({
  loadId,
  charges,
  canEdit,
}: {
  loadId: string;
  charges: ChargeRow[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const listId = useId();
  const { pending, onSubmit, fieldError } = useActionForm(addLoadChargeAction.bind(null, loadId), {
    onSuccess: () => {
      formRef.current?.reset();
      router.refresh();
    },
  });
  const error = fieldError("description") ?? fieldError("amount");

  return (
    <div className="grid gap-1.5">
      {charges.length > 0 ? (
        <ul className="grid gap-1">
          {charges.map((charge) => (
            <li key={charge.id} className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-muted-foreground">{charge.description}</span>
              <span className="font-semibold tabular-nums">{charge.amount}</span>
              {canEdit ? (
                <ConfirmActionButton
                  action={removeLoadChargeAction.bind(null, charge.id)}
                  title="Remove charge?"
                  description={`${charge.description} (${charge.amount}) will no longer be billed. Invoices already generated keep it.`}
                  confirmLabel="Remove"
                  variant="ghost"
                  size="icon-xs"
                >
                  <X aria-label={`Remove ${charge.description}`} />
                </ConfirmActionButton>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">No extra charges.</p>
      )}

      {canEdit ? (
        <form ref={formRef} onSubmit={onSubmit} className="grid gap-1" noValidate>
          <div className="flex gap-1.5">
            <Input
              name="description"
              list={listId}
              placeholder="Charge (e.g. Chassis)"
              aria-label="Charge description"
              className="h-8 min-w-0 flex-1 text-sm"
              aria-invalid={Boolean(fieldError("description"))}
            />
            <Input
              name="amount"
              inputMode="decimal"
              placeholder="0.00"
              aria-label="Amount (USD)"
              className="h-8 w-24 text-right text-sm tabular-nums"
              aria-invalid={Boolean(fieldError("amount"))}
            />
            <Button type="submit" size="sm" variant="outline" className="h-8" disabled={pending}>
              <Plus aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">Add</span>
            </Button>
          </div>
          <datalist id={listId}>
            {CHARGE_SUGGESTIONS.map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
          </datalist>
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </form>
      ) : null}
    </div>
  );
}
