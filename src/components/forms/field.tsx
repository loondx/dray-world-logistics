"use client";

import { useId, type ComponentProps, type ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type FieldRenderProps = { id: string; "aria-invalid"?: true; "aria-describedby"?: string };

// Label + control + error/hint, wired for screen readers.
export function Field({
  label,
  error,
  hint,
  required,
  className,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: (props: FieldRenderProps) => ReactNode;
}) {
  const id = useId();
  const messageId = `${id}-message`;
  return (
    <div className={cn("grid content-start gap-1.5", className)}>
      <Label htmlFor={id} className="text-xs font-medium text-foreground/80">
        {label}
        {required ? <span className="text-destructive">*</span> : null}
      </Label>
      {children({
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": error || hint ? messageId : undefined,
      })}
      {error ? (
        <p id={messageId} className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type TextFieldProps = Omit<ComponentProps<typeof Input>, "id"> & {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  className?: string;
};

export function TextField({ label, error, hint, required, className, ...inputProps }: TextFieldProps) {
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className}>
      {(props) => <Input {...props} {...inputProps} required={required} />}
    </Field>
  );
}

type TextAreaFieldProps = Omit<ComponentProps<typeof Textarea>, "id"> & {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  className?: string;
};

export function TextAreaField({
  label,
  error,
  hint,
  required,
  className,
  ...inputProps
}: TextAreaFieldProps) {
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className}>
      {(props) => <Textarea rows={3} {...props} {...inputProps} required={required} />}
    </Field>
  );
}
