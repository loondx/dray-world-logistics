"use client";

import { Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { ComboboxOption } from "@/components/forms/combobox";
import { QuickCreateDialog } from "@/components/forms/quick-create-dialog";
import { Button } from "@/components/ui/button";
import type { Driver } from "@/generated/prisma/client";

import { DriverForm } from "./driver-form";

type DriverDefaults = Pick<
  Driver,
  "id" | "firstName" | "lastName" | "phone" | "email" | "truckNumber" | "trailerNumber" | "notes"
>;

// Add (no `driver`) or edit a driver in a dialog, then refresh the page.
export function DriverDialog({
  carrierId,
  carrierOptions,
  driver,
}: {
  carrierId?: string;
  carrierOptions?: ComboboxOption[];
  driver?: DriverDefaults;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      {driver ? (
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label={`Edit ${driver.firstName}`}
          onClick={() => setOpen(true)}
        >
          <Pencil />
        </Button>
      ) : (
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus /> Add driver
        </Button>
      )}
      <QuickCreateDialog open={open} onOpenChange={setOpen} title={driver ? "Edit driver" : "New driver"}>
        <DriverForm
          driverId={driver?.id}
          carrierId={carrierId}
          carrierOptions={carrierOptions}
          defaults={driver}
          onCancel={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </QuickCreateDialog>
    </>
  );
}
