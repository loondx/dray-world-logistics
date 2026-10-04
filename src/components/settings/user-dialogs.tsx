"use client";

import { KeyRound, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Field, TextField } from "@/components/forms/field";
import { NativeSelect } from "@/components/forms/native-select";
import { QuickCreateDialog } from "@/components/forms/quick-create-dialog";
import { SubmitButton } from "@/components/forms/submit-button";
import { useActionForm } from "@/components/forms/use-action-form";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/generated/prisma/enums";
import { createUserAction, resetUserPasswordAction } from "@/features/settings/actions";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/password-policy";
import { ROLE_LABELS } from "@/lib/labels/user-role";

export function AddUserDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { pending, onSubmit, fieldError } = useActionForm(createUserAction, {
    onSuccess: () => {
      setOpen(false);
      router.refresh();
    },
  });
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <UserPlus /> Add user
      </Button>
      <QuickCreateDialog
        open={open}
        onOpenChange={setOpen}
        title="Add user"
        description="Give the user their email and password securely."
      >
        <form onSubmit={onSubmit} className="grid gap-3" noValidate>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Full name" name="name" required autoFocus error={fieldError("name")} />
            <TextField label="Email" name="email" type="email" required error={fieldError("email")} />
            <Field label="Role" required error={fieldError("role")}>
              {(props) => (
                <NativeSelect {...props} name="role" defaultValue={UserRole.OPERATIONS}>
                  {Object.values(UserRole).map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </NativeSelect>
              )}
            </Field>
            <TextField
              label="Temporary password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
              error={fieldError("password")}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <SubmitButton pending={pending}>Create user</SubmitButton>
          </div>
        </form>
      </QuickCreateDialog>
    </>
  );
}

export function ResetPasswordDialog({ userId, name }: { userId: string; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { pending, onSubmit, fieldError } = useActionForm(resetUserPasswordAction.bind(null, userId), {
    onSuccess: () => {
      setOpen(false);
      router.refresh();
    },
  });
  return (
    <>
      <Button size="xs" variant="ghost" onClick={() => setOpen(true)}>
        <KeyRound /> Reset password
      </Button>
      <QuickCreateDialog
        open={open}
        onOpenChange={setOpen}
        title={`Reset password: ${name}`}
        description="The user will be signed out of all devices."
      >
        <form onSubmit={onSubmit} className="grid gap-3" noValidate>
          <TextField
            label="New password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            autoFocus
            hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
            error={fieldError("password")}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <SubmitButton pending={pending}>Reset password</SubmitButton>
          </div>
        </form>
      </QuickCreateDialog>
    </>
  );
}
