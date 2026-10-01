"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 300;

// Search box bound to the ?q= URL parameter (shareable/bookmarkable). Resets paging.
export function SearchInput({ placeholder, className }: { placeholder: string; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function update(next: string) {
    setValue(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.trim()) params.set("q", next.trim());
      else params.delete("q");
      params.delete("page");
      startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }));
    }, DEBOUNCE_MS);
  }

  return (
    <div className={cn("relative w-full sm:max-w-xs", className)}>
      <Search
        className={cn(
          "pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground",
          pending && "animate-pulse",
        )}
        aria-hidden="true"
      />
      <Input
        type="search"
        value={value}
        onChange={(event) => update(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-9 pl-8"
      />
    </div>
  );
}
