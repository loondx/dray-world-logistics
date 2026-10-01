import { Loader2 } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { Button } from "@/components/ui/button";

export function SubmitButton({
  pending,
  pendingLabel = "Saving…",
  children,
  ...props
}: ComponentProps<typeof Button> & { pending: boolean; pendingLabel?: string; children: ReactNode }) {
  return (
    <Button type="submit" disabled={pending || props.disabled} {...props}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" aria-hidden="true" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
