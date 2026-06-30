"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface FreetextComboboxProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function FreetextCombobox({
  value,
  onChange,
  suggestions,
  placeholder,
  disabled,
  className,
}: FreetextComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const filtered = value.trim()
    ? suggestions.filter((s) =>
        s.toLowerCase().includes(value.toLowerCase())
      )
    : suggestions;

  const showDropdown = open && filtered.length > 0;

  return (
    <Popover open={showDropdown} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <Input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          placeholder={placeholder}
          disabled={disabled}
          className={className}
          autoComplete="off"
        />
      </PopoverAnchor>
      <PopoverContent
        className="p-1"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {filtered.map((s) => (
          <button
            key={s}
            type="button"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
            onMouseDown={(e) => {
              e.preventDefault();
              onChange(s);
              setOpen(false);
            }}
          >
            <Check
              className={cn(
                "h-4 w-4 shrink-0",
                s === value ? "opacity-100" : "opacity-0"
              )}
            />
            {s}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
