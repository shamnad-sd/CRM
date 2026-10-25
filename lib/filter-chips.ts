import { DEAL_STAGE_LABELS } from "@/lib/constants";
import {
  contactFiltersToQuery,
  dealFiltersToQuery,
  type ContactFilters,
  type DealFilters,
  type FilterChip,
} from "@/lib/filters";
import { formatCurrency } from "@/lib/format";

function withQuery(path: string, query: string) {
  return query ? `${path}?${query}` : path;
}

// Filter days are UTC calendar days, so format in UTC to avoid an off-by-one.
const dayLabel = (day: string) =>
  new Date(`${day}T00:00:00.000Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

function rangeLabel(
  prefix: string,
  from: string | undefined,
  to: string | undefined
) {
  if (from && to) return `${prefix}: ${dayLabel(from)} – ${dayLabel(to)}`;
  if (from) return `${prefix}: from ${dayLabel(from)}`;
  return `${prefix}: until ${dayLabel(to as string)}`;
}

/** One removable chip per active contact filter (sort/page aren't filters). */
export function buildContactChips(
  filters: ContactFilters,
  ownerNames: Map<string, string>
): FilterChip[] {
  const base = "/dashboard/contacts";
  // Removing a filter keeps the rest, and always returns to page 1.
  const without = (overrides: Partial<ContactFilters>) =>
    withQuery(base, contactFiltersToQuery(filters, { ...overrides, page: 1 }));

  const chips: FilterChip[] = [];
  if (filters.q) {
    chips.push({ key: "q", label: `Search: “${filters.q}”`, href: without({ q: undefined }) });
  }
  for (const source of filters.source) {
    chips.push({
      key: `source:${source}`,
      label: `Source: ${source}`,
      href: without({ source: filters.source.filter((s) => s !== source) }),
    });
  }
  for (const tag of filters.tag) {
    chips.push({
      key: `tag:${tag}`,
      label: `Tag: ${tag}`,
      href: without({ tag: filters.tag.filter((t) => t !== tag) }),
    });
  }
  if (filters.owner) {
    chips.push({
      key: "owner",
      label: `Owner: ${ownerNames.get(filters.owner) ?? "Unknown"}`,
      href: without({ owner: undefined }),
    });
  }
  if (filters.from || filters.to) {
    chips.push({
      key: "created",
      label: rangeLabel("Created", filters.from, filters.to),
      href: without({ from: undefined, to: undefined }),
    });
  }
  return chips;
}

export function buildDealChips(
  filters: DealFilters,
  ownerNames: Map<string, string>,
  contactNames: Map<string, string>
): FilterChip[] {
  const base = "/dashboard/deals";
  const without = (overrides: Partial<DealFilters>) =>
    withQuery(base, dealFiltersToQuery(filters, overrides));

  const chips: FilterChip[] = [];
  for (const stage of filters.stage) {
    chips.push({
      key: `stage:${stage}`,
      label: `Stage: ${DEAL_STAGE_LABELS[stage]}`,
      href: without({ stage: filters.stage.filter((s) => s !== stage) }),
    });
  }
  if (filters.owner) {
    chips.push({
      key: "owner",
      label: `Owner: ${ownerNames.get(filters.owner) ?? "Unknown"}`,
      href: without({ owner: undefined }),
    });
  }
  if (filters.minValue !== undefined || filters.maxValue !== undefined) {
    const { minValue: min, maxValue: max } = filters;
    const label =
      min !== undefined && max !== undefined
        ? `Value: ${formatCurrency(min)} – ${formatCurrency(max)}`
        : min !== undefined
          ? `Value: ≥ ${formatCurrency(min)}`
          : `Value: ≤ ${formatCurrency(max as number)}`;
    chips.push({
      key: "value",
      label,
      href: without({ minValue: undefined, maxValue: undefined }),
    });
  }
  if (filters.closeFrom || filters.closeTo) {
    chips.push({
      key: "close",
      label: rangeLabel("Closes", filters.closeFrom, filters.closeTo),
      href: without({ closeFrom: undefined, closeTo: undefined }),
    });
  }
  if (filters.contact) {
    chips.push({
      key: "contact",
      label: `Contact: ${contactNames.get(filters.contact) ?? "Unknown"}`,
      href: without({ contact: undefined }),
    });
  }
  return chips;
}
