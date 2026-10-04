"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Field, TextAreaField, TextField } from "@/components/forms/field";
import { NativeSelect } from "@/components/forms/native-select";
import { QuickCreateDialog } from "@/components/forms/quick-create-dialog";
import { SubmitButton } from "@/components/forms/submit-button";
import { useActionForm } from "@/components/forms/use-action-form";
import { Button } from "@/components/ui/button";
import { EQUIPMENT_OPTIONS, QUOTE_SERVICE_OPTIONS } from "@/config/marketing-content";
import { createLeadAction } from "@/features/quotes/actions";

// Record a lead that came in by phone, email or in person. Same fields as the website
// quote form; only a name plus a phone or email are required.
export function AddLeadDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { pending, onSubmit, fieldError } = useActionForm(createLeadAction, {
    onSuccess: () => {
      setOpen(false);
      router.refresh();
    },
  });

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus /> Add lead
      </Button>
      <QuickCreateDialog
        open={open}
        onOpenChange={setOpen}
        title="Add lead"
        description="For enquiries that came in by phone, email or in person. Name plus a phone or email is enough."
      >
        <form onSubmit={onSubmit} className="grid gap-3" noValidate>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Name" name="name" required autoFocus error={fieldError("name")} />
            <TextField label="Company" name="company" error={fieldError("company")} />
            <TextField label="Phone" name="phone" type="tel" error={fieldError("phone")} />
            <TextField label="Email" name="email" type="email" error={fieldError("email")} />
            <Field label="Service" error={fieldError("serviceType")}>
              {(props) => (
                <NativeSelect {...props} name="serviceType" defaultValue="">
                  <option value="">Not sure yet</option>
                  {QUOTE_SERVICE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </NativeSelect>
              )}
            </Field>
            <Field label="Equipment" error={fieldError("equipment")}>
              {(props) => (
                <NativeSelect {...props} name="equipment" defaultValue="">
                  <option value="">Not sure yet</option>
                  {EQUIPMENT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </NativeSelect>
              )}
            </Field>
            <TextField label="Pickup from" name="origin" error={fieldError("origin")} />
            <TextField label="Deliver to" name="destination" error={fieldError("destination")} />
            <TextField
              label="Number of loads"
              name="loadCount"
              inputMode="numeric"
              error={fieldError("loadCount")}
            />
            <TextField label="Ready date" name="readyDate" type="date" error={fieldError("readyDate")} />
          </div>
          <TextAreaField label="Notes" name="message" rows={3} error={fieldError("message")} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <SubmitButton pending={pending}>Save lead</SubmitButton>
          </div>
        </form>
      </QuickCreateDialog>
    </>
  );
}
