import { Download, Eye, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";

// One document built on demand from the load: View opens it in a new tab, Download saves
// it. Nothing is stored on the server, so the PDF always reflects the load as it is now.
export function DownloadDocumentCard({
  title,
  description,
  href,
  blockedReason,
}: {
  title: string;
  description: string;
  href: string;
  blockedReason: string | null;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-md border bg-background p-3">
      <div className="flex items-start gap-2.5">
        <FileText className="mt-0.5 size-4 shrink-0 text-brand-blue" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {blockedReason ? (
        <p className="mt-auto text-xs text-amber-800">{blockedReason}</p>
      ) : (
        <div className="mt-auto flex gap-1.5">
          <Button asChild size="sm" variant="outline" className="flex-1">
            <a href={`${href}?disposition=inline`} target="_blank" rel="noopener">
              <Eye /> View
            </a>
          </Button>
          <Button asChild size="sm" className="flex-1">
            <a href={href}>
              <Download /> Download
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
