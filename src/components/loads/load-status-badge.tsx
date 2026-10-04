import type { LoadStatus } from "@/generated/prisma/enums";
import { LOAD_STATUS_LABELS, LOAD_STATUS_TONES, type StatusTone } from "@/features/loads/status";
import { cn } from "@/lib/utils";

const TONE_CLASSES: Record<StatusTone, string> = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  progress: "bg-blue-50 text-blue-800 ring-blue-200",
  success: "bg-emerald-50 text-emerald-800 ring-emerald-200",
};

export function LoadStatusBadge({ status, className }: { status: LoadStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ring-1 ring-inset",
        TONE_CLASSES[LOAD_STATUS_TONES[status]],
        className,
      )}
    >
      {LOAD_STATUS_LABELS[status]}
    </span>
  );
}
