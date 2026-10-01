"use client";

import { CheckCircle2, Download, Eye, FileText, Loader2, RotateCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { GeneratedDocumentType } from "@/features/documents/document-types";
import { generateDocumentAction, type GeneratedDocumentResult } from "@/features/documents/actions";

// One document the system can generate: "Generating document…" → success with View / Download.
export function GenerateDocumentCard({
  loadId,
  type,
  title,
  description,
  latestVersion,
  blockedReason,
}: {
  loadId: string;
  type: GeneratedDocumentType;
  title: string;
  description: string;
  latestVersion: number | null;
  blockedReason: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<GeneratedDocumentResult | null>(null);

  function generate() {
    startTransition(async () => {
      const response = await generateDocumentAction(loadId, type);
      if (response.ok) {
        setResult(response.data);
        toast.success(`${response.data.label} v${response.data.version} generated.`);
        router.refresh();
      } else {
        toast.error(response.message);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border bg-background p-3">
      <div className="flex items-start gap-2.5">
        <FileText className="mt-0.5 size-4 shrink-0 text-brand-blue" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      {pending ? (
        <p className="flex items-center gap-1.5 text-xs font-medium text-brand-blue" role="status">
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> Generating document…
        </p>
      ) : result ? (
        <div className="rounded bg-emerald-50 px-2 py-1.5 text-xs text-emerald-900" role="status">
          <p className="flex items-center gap-1 font-medium">
            <CheckCircle2 className="size-3.5" aria-hidden="true" /> Document generated successfully (v
            {result.version})
          </p>
          <div className="mt-1.5 flex gap-1.5">
            <Button asChild size="xs" variant="outline">
              <a href={result.viewUrl} target="_blank" rel="noopener">
                <Eye /> View PDF
              </a>
            </Button>
            <Button asChild size="xs" variant="outline">
              <a href={result.downloadUrl}>
                <Download /> Download PDF
              </a>
            </Button>
          </div>
        </div>
      ) : blockedReason ? (
        <p className="text-xs text-amber-800">{blockedReason}</p>
      ) : null}

      <Button
        size="sm"
        className="mt-auto"
        variant={latestVersion ? "outline" : "default"}
        onClick={generate}
        disabled={pending || Boolean(blockedReason)}
      >
        {latestVersion ? (
          <>
            <RotateCw /> Regenerate (v{latestVersion + 1})
          </>
        ) : (
          <>
            <FileText /> Generate
          </>
        )}
      </Button>
    </div>
  );
}
