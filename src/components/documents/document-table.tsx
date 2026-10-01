"use client";

import { Download, Eye, FileImage, FileText, Lock, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { TextField } from "@/components/forms/field";
import { SubmitButton } from "@/components/forms/submit-button";
import { useActionForm } from "@/components/forms/use-action-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteDocumentAction } from "@/features/documents/actions";
import { DOCUMENT_TYPE_LABELS } from "@/features/documents/document-types";

import { documentUrls, formatFileSize, type DocumentRow } from "./document-list-types";

function DeleteDocumentDialog({ document, onClose }: { document: DocumentRow; onClose: () => void }) {
  const router = useRouter();
  const { pending, onSubmit, fieldError } = useActionForm(deleteDocumentAction.bind(null, document.id), {
    onSuccess: () => {
      onClose();
      router.refresh();
    },
  });
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Remove document?</DialogTitle>
            <DialogDescription>
              “{document.originalFilename}” will be hidden from this load. The file is retained and the
              removal is recorded in the audit log.
            </DialogDescription>
          </DialogHeader>
          <TextField
            label="Reason"
            name="reason"
            required
            autoFocus
            placeholder="e.g. Uploaded to the wrong load"
            error={fieldError("reason")}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <SubmitButton pending={pending} pendingLabel="Removing…" variant="destructive">
              Remove document
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DocumentTable({
  documents,
  canDelete,
  emptyText,
}: {
  documents: DocumentRow[];
  canDelete: boolean;
  emptyText: string;
}) {
  const [deleting, setDeleting] = useState<DocumentRow | null>(null);

  if (documents.length === 0) {
    return <p className="px-1 py-3 text-sm text-muted-foreground">{emptyText}</p>;
  }

  return (
    <>
      <ul className="divide-y rounded-md border bg-background">
        {documents.map((document) => {
          const { viewUrl, downloadUrl } = documentUrls(document.id);
          const Icon = document.mimeType.startsWith("image/") ? FileImage : FileText;
          return (
            <li key={document.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2">
              <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-medium">{DOCUMENT_TYPE_LABELS[document.type]}</span>
                  {document.version ? <Badge variant="secondary">v{document.version}</Badge> : null}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {document.originalFilename} · {formatFileSize(document.sizeBytes)} · {document.createdAt} ·{" "}
                  {document.createdByName}
                  {document.notes ? ` · ${document.notes}` : ""}
                </p>
              </div>
              {document.canView ? (
                <div className="flex gap-1">
                  <Button asChild size="xs" variant="ghost">
                    <a
                      href={viewUrl}
                      target="_blank"
                      rel="noopener"
                      aria-label={`View ${document.originalFilename}`}
                    >
                      <Eye /> View
                    </a>
                  </Button>
                  <Button asChild size="xs" variant="ghost">
                    <a href={downloadUrl} aria-label={`Download ${document.originalFilename}`}>
                      <Download /> Download
                    </a>
                  </Button>
                  {canDelete ? (
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      aria-label={`Remove ${document.originalFilename}`}
                      onClick={() => setDeleting(document)}
                    >
                      <Trash2 />
                    </Button>
                  ) : null}
                </div>
              ) : (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Lock className="size-3" aria-hidden="true" /> Restricted
                </span>
              )}
            </li>
          );
        })}
      </ul>
      {deleting ? <DeleteDocumentDialog document={deleting} onClose={() => setDeleting(null)} /> : null}
    </>
  );
}
