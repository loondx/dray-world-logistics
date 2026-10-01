"use client";

import { useRouter } from "next/navigation";

import { Field, TextAreaField, TextField } from "@/components/forms/field";
import { SubmitButton } from "@/components/forms/submit-button";
import { useActionForm } from "@/components/forms/use-action-form";
import { Input } from "@/components/ui/input";
import type { CompanySettings } from "@/generated/prisma/client";
import {
  setNextLoadNumberAction,
  updateCompanyDetailsAction,
  updateDocumentTermsAction,
  uploadLogoAction,
} from "@/features/settings/actions";
import { ACCEPTED_IMAGE_EXTENSIONS } from "@/lib/storage/file-types";

type CompanyDetails = Pick<
  CompanySettings,
  | "legalName"
  | "displayName"
  | "addressLine1"
  | "addressLine2"
  | "city"
  | "stateProvince"
  | "postalCode"
  | "country"
  | "phone"
  | "operationsPhone"
  | "email"
  | "operationsEmail"
  | "website"
  | "mcNumber"
  | "dotNumber"
  | "businessNumber"
>;

export function CompanyDetailsForm({ defaults }: { defaults: CompanyDetails }) {
  const router = useRouter();
  const { pending, onSubmit, fieldError } = useActionForm(updateCompanyDetailsAction, {
    onSuccess: () => router.refresh(),
  });
  const text = (
    name: keyof CompanyDetails,
    label: string,
    props: { required?: boolean; type?: string; className?: string; hint?: string } = {},
  ) => (
    <TextField
      label={label}
      name={name}
      defaultValue={defaults[name] ?? ""}
      error={fieldError(name)}
      required={props.required}
      type={props.type}
      className={props.className}
      hint={props.hint}
    />
  );

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
        {text("legalName", "Legal company name", { required: true, hint: "Printed on every document." })}
        {text("displayName", "Display name", { required: true, hint: "Shown in the portal and website." })}
      </div>
      <div className="grid gap-3 sm:grid-cols-6">
        {text("addressLine1", "Address", { required: true, className: "sm:col-span-4" })}
        {text("addressLine2", "Address line 2", { className: "sm:col-span-2" })}
        {text("city", "City", { required: true, className: "sm:col-span-2" })}
        {text("stateProvince", "Province / state", { required: true })}
        {text("postalCode", "Postal code", { required: true })}
        {text("country", "Country", { required: true, className: "sm:col-span-2" })}
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        {text("phone", "Main phone", { type: "tel" })}
        {text("operationsPhone", "Operations / dispatch phone", { type: "tel" })}
        {text("email", "Main email", { type: "email" })}
        {text("operationsEmail", "Operations email", { type: "email" })}
        {text("mcNumber", "MC number", { hint: "Printed in the document header." })}
        {text("dotNumber", "DOT number")}
        {text("businessNumber", "Business / tax number")}
        {text("website", "Website")}
      </div>
      <div className="flex justify-end">
        <SubmitButton pending={pending}>Save company details</SubmitButton>
      </div>
    </form>
  );
}

type Terms = Pick<
  CompanySettings,
  "carrierTerms" | "shipperTerms" | "bolInstructions" | "bolTerms" | "paymentInstructions"
>;

export function DocumentTermsForm({ defaults }: { defaults: Terms }) {
  const router = useRouter();
  const { pending, onSubmit, fieldError } = useActionForm(updateDocumentTermsAction, {
    onSuccess: () => router.refresh(),
  });
  const hint = "One item per line — each line becomes a bullet on the PDF. Leave empty to omit.";
  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <TextAreaField
        label="Carrier load confirmation — terms & conditions"
        name="carrierTerms"
        rows={7}
        hint={hint}
        defaultValue={defaults.carrierTerms ?? ""}
        error={fieldError("carrierTerms")}
      />
      <TextAreaField
        label="Customer rate confirmation — terms"
        name="shipperTerms"
        rows={5}
        hint={hint}
        defaultValue={defaults.shipperTerms ?? ""}
        error={fieldError("shipperTerms")}
      />
      <TextAreaField
        label="Customer payment instructions"
        name="paymentInstructions"
        rows={3}
        hint="Printed on the customer rate confirmation."
        defaultValue={defaults.paymentInstructions ?? ""}
        error={fieldError("paymentInstructions")}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <TextAreaField
          label="Bill of lading — instructions"
          name="bolInstructions"
          rows={4}
          defaultValue={defaults.bolInstructions ?? ""}
          error={fieldError("bolInstructions")}
        />
        <TextAreaField
          label="Bill of lading — terms"
          name="bolTerms"
          rows={4}
          hint={hint}
          defaultValue={defaults.bolTerms ?? ""}
          error={fieldError("bolTerms")}
        />
      </div>
      <div className="flex justify-end">
        <SubmitButton pending={pending}>Save document terms</SubmitButton>
      </div>
    </form>
  );
}

export function LogoUploadForm() {
  const router = useRouter();
  const { pending, onSubmit, fieldError } = useActionForm(uploadLogoAction, {
    onSuccess: () => router.refresh(),
  });
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-end" noValidate>
      <Field label="Upload new logo (PNG or JPG, max 2 MB)" className="flex-1" error={fieldError("logo")}>
        {(props) => (
          <Input
            {...props}
            type="file"
            name="logo"
            accept={ACCEPTED_IMAGE_EXTENSIONS}
            className="h-auto py-1.5"
          />
        )}
      </Field>
      <SubmitButton pending={pending} pendingLabel="Uploading…" variant="outline">
        Upload logo
      </SubmitButton>
    </form>
  );
}

export function LoadNumberForm({ nextLoadNumber }: { nextLoadNumber: number }) {
  const router = useRouter();
  const { pending, onSubmit, fieldError } = useActionForm(setNextLoadNumberAction, {
    onSuccess: () => router.refresh(),
  });
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-end" noValidate>
      <TextField
        label="Next load number"
        name="nextLoadNumber"
        inputMode="numeric"
        defaultValue={String(nextLoadNumber)}
        hint="Can only move forward — numbers are never reused."
        error={fieldError("nextLoadNumber")}
        className="sm:w-60"
      />
      <SubmitButton pending={pending} variant="outline">
        Update
      </SubmitButton>
    </form>
  );
}
