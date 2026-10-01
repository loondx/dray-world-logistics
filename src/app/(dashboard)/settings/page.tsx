import { Trash2 } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";

import { ConfirmActionButton } from "@/components/dashboard/confirm-action-button";
import { Panel } from "@/components/dashboard/description-list";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  CompanyDetailsForm,
  DocumentTermsForm,
  LoadNumberForm,
  LogoUploadForm,
} from "@/components/settings/settings-forms";
import { AddUserDialog, ResetPasswordDialog } from "@/components/settings/user-dialogs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { removeLogoAction, setUserActiveAction } from "@/features/settings/actions";
import { formatTimestamp } from "@/lib/dates";
import { ROLE_LABELS } from "@/lib/labels/user-role";
import { requirePermission } from "@/server/auth/guards";
import { getCompanySettings } from "@/server/services/company-settings.service";
import { getNextLoadNumber } from "@/server/services/settings.service";
import { listUsers } from "@/server/services/user-admin.service";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const currentUser = await requirePermission("settings:manage");
  const [settings, users, nextLoadNumber] = await Promise.all([
    getCompanySettings(),
    listUsers(),
    getNextLoadNumber(),
  ]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <PageHeader title="Settings" description="Company profile, document content and user access." />

      <Panel title="Company details">
        <CompanyDetailsForm defaults={settings} />
      </Panel>

      <Panel
        title="Logo"
        actions={
          settings.logoStorageKey ? (
            <ConfirmActionButton
              action={removeLogoAction}
              title="Remove logo?"
              description="Documents will show the company name as text instead."
              confirmLabel="Remove"
              variant="ghost"
              size="xs"
            >
              <Trash2 /> Remove
            </ConfirmActionButton>
          ) : null
        }
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-20 w-56 shrink-0 items-center justify-center rounded-md border bg-muted/40 p-2">
            {settings.logoStorageKey ? (
              // Private, authenticated image: served as-is (no optimiser, which can't forward cookies).
              <Image
                src={`/api/company/logo?v=${encodeURIComponent(settings.logoStorageKey)}`}
                alt="Company logo"
                width={220}
                height={72}
                unoptimized
                className="max-h-full w-auto max-w-full object-contain"
              />
            ) : (
              <span className="text-xs text-muted-foreground">No logo — documents show the name</span>
            )}
          </div>
          <div className="flex-1">
            <LogoUploadForm />
          </div>
        </div>
      </Panel>

      <Panel title="Document terms & instructions">
        <p className="mb-3 text-sm text-muted-foreground">
          These texts are printed on generated documents. Enter your final, legally reviewed wording — the
          system does not add any terms of its own. Changes apply to documents generated from now on; earlier
          versions are kept as they were.
        </p>
        <DocumentTermsForm defaults={settings} />
      </Panel>

      <Panel title="Load numbers">
        <LoadNumberForm nextLoadNumber={nextLoadNumber} />
      </Panel>

      <Panel title="Users" actions={<AddUserDialog />}>
        <div className="-m-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden md:table-cell">Last sign-in</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className={user.active ? undefined : "opacity-60"}>
                  <TableCell className="font-medium">
                    {user.name}
                    {user.id === currentUser.id ? (
                      <Badge variant="secondary" className="ml-2">
                        You
                      </Badge>
                    ) : null}
                    {!user.active ? (
                      <Badge variant="secondary" className="ml-2">
                        Inactive
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{ROLE_LABELS[user.role]}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatTimestamp(user.lastLoginAt, "Never")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <ResetPasswordDialog userId={user.id} name={user.name} />
                      {user.id !== currentUser.id ? (
                        <ConfirmActionButton
                          action={setUserActiveAction.bind(null, user.id, !user.active)}
                          title={user.active ? `Deactivate ${user.name}?` : `Reactivate ${user.name}?`}
                          description={
                            user.active
                              ? "They will be signed out immediately and can no longer sign in. Their history is kept."
                              : "They will be able to sign in again."
                          }
                          confirmLabel={user.active ? "Deactivate" : "Reactivate"}
                          variant="ghost"
                          size="xs"
                        >
                          {user.active ? "Deactivate" : "Reactivate"}
                        </ConfirmActionButton>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Panel>
    </div>
  );
}
