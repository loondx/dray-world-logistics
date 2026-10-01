"use client";

import { CheckCircle2, FileText, Plus, SquareArrowOutUpRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { SavedLoad } from "@/features/loads/actions";

export function LoadCreatedPanel({
  load,
  onCreateAnother,
}: {
  load: SavedLoad;
  onCreateAnother: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-3 rounded-lg border bg-card px-6 py-10 text-center">
      <CheckCircle2 className="size-10 text-emerald-600" aria-hidden="true" />
      <p className="text-sm font-medium text-muted-foreground">Load created successfully</p>
      <p className="text-3xl font-bold tracking-tight text-brand-navy">Load #{load.loadNumber}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link href={`/loads/${load.id}`}>
            <SquareArrowOutUpRight /> Open load
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/loads/${load.id}#documents`}>
            <FileText /> Generate documents
          </Link>
        </Button>
        <Button variant="outline" onClick={onCreateAnother}>
          <Plus /> Create another load
        </Button>
      </div>
    </div>
  );
}
