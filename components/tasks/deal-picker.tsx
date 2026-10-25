"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface DealPickerOption {
  id: string;
  title: string;
}

interface DealPickerProps {
  deals: DealPickerOption[];
  defaultDealId?: string;
}

export function DealPicker({ deals, defaultDealId }: DealPickerProps) {
  const defaultDeal = deals.find((d) => d.id === defaultDealId);
  const [selectedId, setSelectedId] = useState(defaultDealId ?? "");
  const [query, setQuery] = useState(defaultDeal?.title ?? "");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return deals.slice(0, 8);
    return deals.filter((d) => d.title.toLowerCase().includes(q)).slice(0, 8);
  }, [deals, query]);

  return (
    <div className="relative">
      <input type="hidden" name="dealId" value={selectedId} />
      <Input
        type="text"
        placeholder="Search deals by title... (optional)"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setSelectedId("");
          setOpen(true);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-slate-200 bg-white shadow-md">
          {filtered.map((deal) => (
            <li key={deal.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setSelectedId(deal.id);
                  setQuery(deal.title);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-slate-100",
                  selectedId === deal.id && "bg-slate-50"
                )}
              >
                <span className="font-medium text-slate-900">{deal.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && filtered.length === 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-md">
          No deals found.
        </div>
      )}
    </div>
  );
}
