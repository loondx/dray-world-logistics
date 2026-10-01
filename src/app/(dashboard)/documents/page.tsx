import { Download, Eye, FileText, Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/dashboard/empty-state";
import { AutoSubmitForm } from "@/components/dashboard/list/auto-submit-form";
import { Pagination } from "@/components/dashboard/list/pagination";
import { PageHeader } from "@/components/dashboard/page-header";
import { documentUrls, formatFileSize } from "@/components/documents/document-list-types";
import { NativeSelect } from "@/components/forms/native-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DocumentSource, DocumentType } from "@/generated/prisma/enums";
import { DOCUMENT_TYPE_LABELS } from "@/features/documents/document-types";
import { formatTimestamp } from "@/lib/dates";
import { requirePermission } from "@/server/auth/guards";
import { listDocuments } from "@/server/documents/document.queries";
import { canViewDocumentType } from "@/server/permissions/document-access";
import { firstParam, parsePage } from "@/server/services/pagination";
import { getUserNames } from "@/server/services/user.service";

export const metadata: Metadata = { title: "Documents" };

function oneOf<T extends string>(value: string | undefined, allowed: T[]): T | undefined {
  return allowed.find((option) => option === value);
}

export default async function DocumentsPage({ searchParams }: PageProps<"/documents">) {
  const user = await requirePermission("documents:read");
  const params = await searchParams;
  const q = firstParam(params.q);
  const type = oneOf(firstParam(params.type), Object.values(DocumentType));
  const source = oneOf(firstParam(params.source), Object.values(DocumentSource));
  const result = await listDocuments({ q, type, source, page: parsePage(params.page) });
  const names = await getUserNames(result.items.map((item) => item.createdById));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <PageHeader
        title="Documents"
        description="Every generated and uploaded document, newest first. Documents are managed from their load."
      />

      <AutoSubmitForm className="flex flex-col gap-2 rounded-lg border bg-card p-3 sm:flex-row sm:items-end">
        <div className="grid flex-1 gap-1">
          <label htmlFor="d-q" className="text-[11px] font-medium text-muted-foreground">
            Search
          </label>
          <Input
            id="d-q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Load #, container #, client, file name…"
            className="h-9"
          />
        </div>
        <div className="grid gap-1 sm:w-56">
          <label htmlFor="d-type" className="text-[11px] font-medium text-muted-foreground">
            Type
          </label>
          <NativeSelect id="d-type" name="type" defaultValue={type ?? ""}>
            <option value="">All types</option>
            {Object.values(DocumentType).map((value) => (
              <option key={value} value={value}>
                {DOCUMENT_TYPE_LABELS[value]}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-1 sm:w-40">
          <label htmlFor="d-source" className="text-[11px] font-medium text-muted-foreground">
            Source
          </label>
          <NativeSelect id="d-source" name="source" defaultValue={source ?? ""}>
            <option value="">All</option>
            <option value="GENERATED">Generated</option>
            <option value="UPLOADED">Uploaded</option>
          </NativeSelect>
        </div>
        <Button type="submit" size="sm">
          Apply
        </Button>
      </AutoSubmitForm>

      <div className="overflow-x-auto rounded-lg border bg-card">
        {result.items.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No documents found"
            description="Generate or upload documents from a load's page."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Load</TableHead>
                <TableHead className="hidden md:table-cell">Client</TableHead>
                <TableHead className="hidden sm:table-cell">Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((document) => {
                const { viewUrl, downloadUrl } = documentUrls(document.id);
                const allowed = canViewDocumentType(user.role, document.type);
                return (
                  <TableRow key={document.id}>
                    <TableCell>
                      <div className="flex items-center gap-1.5 font-medium">
                        {DOCUMENT_TYPE_LABELS[document.type]}
                        {document.version ? <Badge variant="secondary">v{document.version}</Badge> : null}
                      </div>
                      <div className="max-w-72 truncate text-xs text-muted-foreground">
                        {document.originalFilename} · {formatFileSize(document.sizeBytes)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/loads/${document.load.id}#documents`}
                        className="font-semibold text-brand-navy hover:underline"
                      >
                        #{document.load.loadNumber}
                      </Link>
                      {document.load.containerNumber ? (
                        <div className="font-mono text-xs text-muted-foreground">
                          {document.load.containerNumber}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{document.load.client.companyName}</TableCell>
                    <TableCell className="hidden text-xs sm:table-cell">
                      {formatTimestamp(document.createdAt)}
                      <div className="text-muted-foreground">
                        {(document.createdById && names.get(document.createdById)) || "System"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {allowed ? (
                        <div className="flex justify-end gap-1">
                          <Button asChild size="xs" variant="ghost">
                            <a href={viewUrl} target="_blank" rel="noopener">
                              <Eye /> View
                            </a>
                          </Button>
                          <Button asChild size="xs" variant="ghost">
                            <a href={downloadUrl}>
                              <Download /> Download
                            </a>
                          </Button>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Lock className="size-3" aria-hidden="true" /> Restricted
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <Pagination
        pathname="/documents"
        searchParams={params}
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
      />
    </div>
  );
}
