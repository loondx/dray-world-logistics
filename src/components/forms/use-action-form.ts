"use client";

import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";

import type { ActionResult } from "@/lib/forms/action-result";

type Options<TData> = {
  successMessage?: string | ((data: TData) => string);
  onSuccess?: (data: TData) => void;
};

// Submits a form to a server action without React's automatic form reset, so a
// validation error never wipes what the user typed. Shows toast feedback.
export function useActionForm<TData>(
  action: (formData: FormData) => Promise<ActionResult<TData>>,
  options: Options<TData> = {},
) {
  const [result, setResult] = useState<ActionResult<TData> | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Quick-create dialogs are portaled but still inside the parent form's React
    // tree; without this their submit would bubble up and submit the parent too.
    event.stopPropagation();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const next = await action(formData);
      setResult(next);
      if (next.ok) {
        const { successMessage } = options;
        const message =
          typeof successMessage === "function" ? successMessage(next.data) : (successMessage ?? next.message);
        if (message) toast.success(message);
        options.onSuccess?.(next.data);
      } else {
        toast.error(next.message);
      }
    });
  }

  function fieldError(name: string): string | undefined {
    return result && !result.ok ? result.fieldErrors?.[name]?.[0] : undefined;
  }

  return { result, pending, onSubmit, fieldError };
}
