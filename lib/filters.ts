import { z } from "zod";
import {
  CONTACT_SOURCES,
  DEAL_STAGES,
  type ContactSource,
  type DealStage,
} from "@/lib/constants";

/**
 * URL search-param parsing for the Contacts and Deals list filters.
 *
 * Every field is validated on its own and falls back to its default when
 * invalid, so a hand-edited or stale URL never crashes the page — it just
 * ignores the bad part. This module is free of server-only imports so the
 * same parsers/serializers can be used by pages and filter UI alike.
 */

export type RawSearchParams = Record<string, string | string[] | undefined>;

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MAX_LIST_ITEMS = 20;
const MAX_VALUE = 1_000_000_000;

const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

/** `?a=1&a=2` arrives as an array, `?a=1` as a string, absent as undefined. */
const toArray = (value: unknown): unknown[] => {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
};

/** Only the first value is used for single-valued params. */
const toFirst = (value: unknown) => (Array.isArray(value) ? value[0] : value);

const optionalText = (max: number) =>
  z.preprocess(
    (v) => blankToUndefined(toFirst(v)),
    z.string().trim().max(max).optional()
  ).catch(undefined);

const optionalObjectId = z
  .preprocess(
    (v) => blankToUndefined(toFirst(v)),
    z.string().trim().regex(OBJECT_ID_REGEX).optional()
  )
  .catch(undefined);

const isRealDate = (value: string) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
};

const optionalDate = z
  .preprocess(
    (v) => blankToUndefined(toFirst(v)),
    z.string().trim().regex(DATE_REGEX).refine(isRealDate).optional()
  )
  .catch(undefined);

const optionalAmount = z
  .preprocess(
    (v) => blankToUndefined(toFirst(v)),
    z.coerce.number().finite().min(0).max(MAX_VALUE).optional()
  )
  .catch(undefined);

/** Multi-select of known enum values; unknown entries are dropped, not fatal. */
function enumList<T extends string>(allowed: readonly T[]) {
  return z
    .preprocess(
      (v) => toArray(v).slice(0, MAX_LIST_ITEMS),
      z.array(z.unknown()).transform((items) => {
        const known = items.filter((item): item is T =>
          allowed.includes(item as T)
        );
        return [...new Set(known)];
      })
    )
    .catch([] as T[]);
}

const freeTextList = z
  .preprocess(
    (v) => toArray(v).slice(0, MAX_LIST_ITEMS),
    z.array(z.unknown()).transform((items) => {
      const strings = items
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter((item) => item.length > 0 && item.length <= 50);
      return [...new Set(strings)];
    })
  )
  .catch([] as string[]);

const page = z
  .preprocess(toFirst, z.coerce.number().int().min(1).max(100_000))
  .catch(1);

/** Swaps an inverted range instead of silently returning nothing. */
function orderRange<T extends string | number>(
  low: T | undefined,
  high: T | undefined
): [T | undefined, T | undefined] {
  if (low !== undefined && high !== undefined && low > high) {
    return [high, low];
  }
  return [low, high];
}

// ───────────────────────────── Contacts ─────────────────────────────

export const CONTACT_SORT_FIELDS = ["createdAt", "name", "company"] as const;
export type ContactSortField = (typeof CONTACT_SORT_FIELDS)[number];

export const CONTACT_SORT_LABELS: Record<ContactSortField, string> = {
  createdAt: "Created date",
  name: "Name",
  company: "Company",
};

export type SortDirection = "asc" | "desc";

export const contactFiltersSchema = z.object({
  q: optionalText(100),
  source: enumList<ContactSource>(CONTACT_SOURCES),
  tag: freeTextList,
  owner: optionalObjectId,
  from: optionalDate,
  to: optionalDate,
  sort: z
    .preprocess(toFirst, z.enum(CONTACT_SORT_FIELDS))
    .catch("createdAt" as ContactSortField),
  dir: z.preprocess(toFirst, z.enum(["asc", "desc"])).catch("desc" as SortDirection),
  page,
});

export interface ContactFilters {
  q?: string;
  source: ContactSource[];
  tag: string[];
  owner?: string;
  /** Inclusive YYYY-MM-DD bounds on createdAt. */
  from?: string;
  to?: string;
  sort: ContactSortField;
  dir: SortDirection;
  page: number;
}

export function parseContactFilters(raw: RawSearchParams): ContactFilters {
  const parsed = contactFiltersSchema.parse(raw);
  const [from, to] = orderRange(parsed.from, parsed.to);
  return { ...parsed, from, to };
}

export const DEFAULT_CONTACT_FILTERS: ContactFilters = parseContactFilters({});

/** Filters other than sort/page — what the chips and "Clear all" act on. */
export function hasActiveContactFilters(f: ContactFilters): boolean {
  return Boolean(
    f.q || f.source.length || f.tag.length || f.owner || f.from || f.to
  );
}

export function contactFiltersToQuery(
  filters: ContactFilters,
  overrides: Partial<ContactFilters> = {}
): string {
  const f = { ...filters, ...overrides };
  const params = new URLSearchParams();
  if (f.q) params.set("q", f.q);
  f.source.forEach((s) => params.append("source", s));
  f.tag.forEach((t) => params.append("tag", t));
  if (f.owner) params.set("owner", f.owner);
  if (f.from) params.set("from", f.from);
  if (f.to) params.set("to", f.to);
  if (f.sort !== DEFAULT_CONTACT_FILTERS.sort) params.set("sort", f.sort);
  if (f.dir !== DEFAULT_CONTACT_FILTERS.dir) params.set("dir", f.dir);
  if (f.page > 1) params.set("page", String(f.page));
  return params.toString();
}

// ────────────────────────────── Deals ───────────────────────────────

export const dealFiltersSchema = z.object({
  stage: enumList<DealStage>(DEAL_STAGES),
  owner: optionalObjectId,
  minValue: optionalAmount,
  maxValue: optionalAmount,
  closeFrom: optionalDate,
  closeTo: optionalDate,
  contact: optionalObjectId,
});

export interface DealFilters {
  stage: DealStage[];
  owner?: string;
  minValue?: number;
  maxValue?: number;
  /** Inclusive YYYY-MM-DD bounds on expectedCloseDate. */
  closeFrom?: string;
  closeTo?: string;
  contact?: string;
}

export function parseDealFilters(raw: RawSearchParams): DealFilters {
  const parsed = dealFiltersSchema.parse(raw);
  const [minValue, maxValue] = orderRange(parsed.minValue, parsed.maxValue);
  const [closeFrom, closeTo] = orderRange(parsed.closeFrom, parsed.closeTo);
  return { ...parsed, minValue, maxValue, closeFrom, closeTo };
}

export function hasActiveDealFilters(f: DealFilters): boolean {
  return Boolean(
    f.stage.length ||
      f.owner ||
      f.minValue !== undefined ||
      f.maxValue !== undefined ||
      f.closeFrom ||
      f.closeTo ||
      f.contact
  );
}

export function dealFiltersToQuery(
  filters: DealFilters,
  overrides: Partial<DealFilters> = {}
): string {
  const f = { ...filters, ...overrides };
  const params = new URLSearchParams();
  f.stage.forEach((s) => params.append("stage", s));
  if (f.owner) params.set("owner", f.owner);
  if (f.minValue !== undefined) params.set("minValue", String(f.minValue));
  if (f.maxValue !== undefined) params.set("maxValue", String(f.maxValue));
  if (f.closeFrom) params.set("closeFrom", f.closeFrom);
  if (f.closeTo) params.set("closeTo", f.closeTo);
  if (f.contact) params.set("contact", f.contact);
  return params.toString();
}

// ─────────────────────────── Shared helpers ──────────────────────────

/**
 * Converts inclusive YYYY-MM-DD bounds into a half-open UTC Date range
 * ([start, endExclusive)), suitable for `$gte` / `$lt`.
 */
export function dateRangeToBounds(
  from?: string,
  to?: string
): { $gte?: Date; $lt?: Date } | undefined {
  if (!from && !to) return undefined;
  const range: { $gte?: Date; $lt?: Date } = {};
  if (from) range.$gte = new Date(`${from}T00:00:00.000Z`);
  if (to) {
    const end = new Date(`${to}T00:00:00.000Z`);
    end.setUTCDate(end.getUTCDate() + 1);
    range.$lt = end;
  }
  return range;
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export interface FilterChip {
  key: string;
  label: string;
  /** Link that removes just this filter. */
  href: string;
}
