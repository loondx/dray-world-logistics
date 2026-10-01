"use client";

import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type ComboboxOption = {
  value: string;
  label: string;
  description?: string;
  // Extra text matched by the search box (e.g. MC number, city).
  keywords?: string[];
};

// Searchable select built on Radix Popover + cmdk (keyboard and screen-reader
// accessible). Submits its value through a hidden input named `name`.
export function Combobox({
  id,
  name,
  options,
  value,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Type to search…",
  emptyText = "No matches.",
  createLabel,
  onCreate,
  disabled,
  invalid,
  describedBy,
  renderValue,
}: {
  id?: string;
  name?: string;
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  createLabel?: string;
  onCreate?: (search: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  renderValue?: (option: ComboboxOption) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = options.find((option) => option.value === value);

  return (
    <>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            disabled={disabled}
            className="h-9 w-full justify-between px-2.5 font-normal"
          >
            <span className={cn("truncate", !selected && "text-muted-foreground")}>
              {selected ? (renderValue ? renderValue(selected) : selected.label) : placeholder}
            </span>
            <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) min-w-72 p-0" align="start">
          <Command>
            <CommandInput placeholder={searchPlaceholder} value={search} onValueChange={setSearch} />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    keywords={[
                      option.label,
                      ...(option.description ? [option.description] : []),
                      ...(option.keywords ?? []),
                    ]}
                    onSelect={() => {
                      onChange(option.value);
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    <Check
                      className={cn("size-3.5", option.value === value ? "opacity-100" : "opacity-0")}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <div className="truncate">{option.label}</div>
                      {option.description ? (
                        <div className="truncate text-xs text-muted-foreground">{option.description}</div>
                      ) : null}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              {onCreate ? (
                <>
                  <CommandSeparator alwaysRender />
                  {/* forceMount: always offer "create" — especially when nothing matched. */}
                  <CommandGroup forceMount>
                    <CommandItem
                      forceMount
                      value="__create__"
                      onSelect={() => {
                        setOpen(false);
                        onCreate(search);
                        setSearch("");
                      }}
                    >
                      <Plus className="size-3.5" aria-hidden="true" />
                      {createLabel ?? "Create new"}
                      {search ? <span className="text-muted-foreground">“{search}”</span> : null}
                    </CommandItem>
                  </CommandGroup>
                </>
              ) : null}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
}
