import { z } from "zod";

// Uniform result shape for every server action used by a form.
export type FieldErrors = Record<string, string[] | undefined>;

export type ActionResult<TData = undefined> =
  { ok: true; message?: string; data: TData } | { ok: false; message: string; fieldErrors?: FieldErrors };

export const IDLE_RESULT = { ok: false, message: "" } as const satisfies ActionResult<never>;

export function success<TData>(data: TData, message?: string): ActionResult<TData> {
  return { ok: true, data, message };
}

export function failure(message: string, fieldErrors?: FieldErrors): ActionResult<never> {
  return { ok: false, message, fieldErrors };
}

export function validationFailure(error: z.ZodError): ActionResult<never> {
  return failure("Please correct the highlighted fields.", z.flattenError(error).fieldErrors);
}

// FormData → plain object of strings (files and repeated keys are ignored).
export function formDataToObject(formData: FormData): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !key.startsWith("$ACTION")) result[key] = value;
  }
  return result;
}
