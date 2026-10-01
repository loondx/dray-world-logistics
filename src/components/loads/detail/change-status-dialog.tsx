"use client";

import { ArrowRight, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Field, TextField } from "@/components/forms/field";
import { NativeSelect } from "@/components/forms/native-select";
import { SubmitButton } from "@/components/forms/submit-button";
import { useActionForm } from "@/components/forms/use-action-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { LoadStatus } from "@/generated/prisma/enums";
import { changeLoadStatusAction } from "@/features/loads/actions";
import { LOAD_STATUS_LABELS, LOAD_STATUS_ORDER, nextLoadStatus } from "@/features/loads/status";

export function ChangeStatusDialog({ loadId, status }: { loadId: string; status: LoadStatus }) {
  const router = useRouter();
  const next = nextLoadStatus(status);
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<LoadStatus>(next ?? status);
  const { pending, onSubmit, fieldError } = useActionForm(changeLoadStatusAction.bind(null, loadId), {
    onSuccess: () => {
      setOpen(false);
      router.refresh();
    },
  });

  function openWith(status: LoadStatus) {
    setTarget(status);
    setOpen(true);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {next ? (
        <Button size="sm" onClick={() => openWith(next)}>
          Mark {LOAD_STATUS_LABELS[next]} <ArrowRight />
        </Button>
      ) : null}
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" onClick={() => setTarget(next ?? status)}>
          <RefreshCw /> Change status
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Change status</DialogTitle>
            <DialogDescription>
              Currently <strong>{LOAD_STATUS_LABELS[status]}</strong>. Every change is kept in the load
              timeline.
            </DialogDescription>
          </DialogHeader>
          <Field label="New status" error={fieldError("status")}>
            {(props) => (
              <NativeSelect
                {...props}
                name="status"
                value={target}
                onChange={(event) => {
                  const selected = LOAD_STATUS_ORDER.find((option) => option === event.target.value);
                  if (selected) setTarget(selected);
                }}
              >
                {LOAD_STATUS_ORDER.filter((option) => option !== status).map((option) => (
                  <option key={option} value={option}>
                    {LOAD_STATUS_LABELS[option]}
                  </option>
                ))}
              </NativeSelect>
            )}
          </Field>
          <TextField
            label="Note (optional)"
            name="notes"
            placeholder="e.g. POD received by email"
            error={fieldError("notes")}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <SubmitButton pending={pending}>Update status</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
