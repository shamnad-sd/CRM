import Link from "next/link";
import type { FilterChip } from "@/lib/filters";

interface FilterChipsProps {
  chips: FilterChip[];
  clearHref: string;
}

export function FilterChips({ chips, clearHref }: FilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Link
          key={chip.key}
          href={chip.href}
          aria-label={`Remove filter: ${chip.label}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-100"
        >
          {chip.label}
          <span aria-hidden className="text-slate-400">
            ✕
          </span>
        </Link>
      ))}
      <Link
        href={clearHref}
        className="text-xs font-medium text-slate-600 underline-offset-4 hover:underline"
      >
        Clear all
      </Link>
    </div>
  );
}
