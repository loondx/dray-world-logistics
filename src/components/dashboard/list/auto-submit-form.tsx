"use client";

import type { ComponentProps } from "react";

// GET filter form that re-submits when a select/date changes (filters live in the
// URL, so results are shareable and bookmarkable). Works without JavaScript via
// its submit button.
export function AutoSubmitForm(props: ComponentProps<"form">) {
  return (
    <form
      method="get"
      {...props}
      onChange={(event) => {
        const target = event.target;
        if (
          target instanceof HTMLSelectElement ||
          (target instanceof HTMLInputElement && target.type === "date")
        ) {
          event.currentTarget.requestSubmit();
        }
      }}
    />
  );
}
