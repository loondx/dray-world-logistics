"use client";

import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Field, TextField } from "@/components/forms/field";
import { NativeSelect } from "@/components/forms/native-select";
import { SubmitButton } from "@/components/forms/submit-button";
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
import { Input } from "@/components/ui/input";
import { DOCUMENT_TYPE_LABELS, UPLOADABLE_DOCUMENT_TYPES } from "@/features/documents/document-types";
import { ACCEPTED_UPLOAD_EXTENSIONS } from "@/lib/storage/file-types";

type UploadResponse = { ok: boolean; message: string };

function isUploadResponse(value: unknown): value is UploadResponse {
  return typeof value === "object" && value !== null && "ok" in value && "message" in value;
}

// Upload POD / COD / other documents. Posts multipart data to the upload route handler.
export function UploadDocumentDialog({
  loadId,
  maxSizeMb,
  triggerLabel = "Upload document",
  triggerVariant = "outline",
}: {
  loadId: string;
  maxSizeMb: number;
  triggerLabel?: string;
  triggerVariant?: "outline" | "default";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("file");
    if (!(file instanceof File) || file.size === 0) {
      setError("Choose a file to upload.");
      return;
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`Files must be ${maxSizeMb} MB or smaller.`);
      return;
    }

    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/loads/${loadId}/documents`, { method: "POST", body: data });
      const body: unknown = await response.json().catch(() => null);
      const result = isUploadResponse(body)
        ? body
        : { ok: false, message: "The upload failed. Please try again." };
      if (!result.ok) {
        setError(result.message);
        return;
      }
      toast.success(result.message);
      form.reset();
      setOpen(false);
      router.refresh();
    } catch {
      setError("Network error — the file was not uploaded. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        setError(null);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant={triggerVariant}>
          <Upload /> {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Upload document</DialogTitle>
            <DialogDescription>
              PDF, JPG or PNG up to {maxSizeMb} MB. Stored privately with this load.
            </DialogDescription>
          </DialogHeader>
          <Field label="Document type" required>
            {(props) => (
              <NativeSelect {...props} name="type" defaultValue="POD">
                {UPLOADABLE_DOCUMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {DOCUMENT_TYPE_LABELS[type]}
                  </option>
                ))}
              </NativeSelect>
            )}
          </Field>
          <Field label="File" required error={error ?? undefined}>
            {(props) => (
              <Input
                {...props}
                type="file"
                name="file"
                accept={ACCEPTED_UPLOAD_EXTENSIONS}
                required
                className="h-auto py-1.5"
              />
            )}
          </Field>
          <TextField
            label="Note (optional)"
            name="notes"
            maxLength={500}
            placeholder="e.g. Signed by J. Smith"
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <SubmitButton pending={pending} pendingLabel="Uploading…">
              Upload
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
