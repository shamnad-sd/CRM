import Link from "next/link";
import { CONTACT_SOURCES } from "@/lib/constants";
import {
  CONTACT_SORT_FIELDS,
  CONTACT_SORT_LABELS,
  hasActiveContactFilters,
  type ContactFilters,
} from "@/lib/filters";
import type { UserOption } from "@/lib/users-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckboxDropdown } from "@/components/filters/checkbox-dropdown";
import { SelectField } from "@/components/filters/select-field";

interface ContactFilterBarProps {
  filters: ContactFilters;
  tagOptions: string[];
  /** Present only for admins; omitting it hides the owner filter. */
  ownerOptions?: UserOption[];
}

/**
 * Plain GET form: submitting rewrites the URL (and drops `page`), so every
 * filtered view is a shareable link and survives reload.
 */
export function ContactFilterBar({
  filters,
  tagOptions,
  ownerOptions,
}: ContactFilterBarProps) {
  return (
    <form
      method="get"
      action="/dashboard/contacts"
      className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4"
    >
      <Input
        type="text"
        name="q"
        defaultValue={filters.q}
        placeholder="Search name, email, or company..."
        className="max-w-sm"
      />

      <div className="flex flex-wrap items-end gap-3">
        <CheckboxDropdown
          name="source"
          label="Source"
          options={CONTACT_SOURCES.map((s) => ({ value: s, label: s }))}
          selected={filters.source}
        />
        <CheckboxDropdown
          name="tag"
          label="Tags"
          options={tagOptions.map((t) => ({ value: t, label: t }))}
          selected={filters.tag}
        />

        {ownerOptions && (
          <SelectField
            name="owner"
            defaultValue={filters.owner ?? ""}
            aria-label="Owner"
          >
            <option value="">All owners</option>
            {ownerOptions.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </SelectField>
        )}

        <label className="flex flex-col gap-1 text-xs text-slate-500">
          Created from
          <Input type="date" name="from" defaultValue={filters.from} className="w-40" />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-500">
          Created to
          <Input type="date" name="to" defaultValue={filters.to} className="w-40" />
        </label>

        <label className="flex flex-col gap-1 text-xs text-slate-500">
          Sort by
          <span className="flex gap-2">
            <SelectField name="sort" defaultValue={filters.sort} aria-label="Sort by">
              {CONTACT_SORT_FIELDS.map((field) => (
                <option key={field} value={field}>
                  {CONTACT_SORT_LABELS[field]}
                </option>
              ))}
            </SelectField>
            <SelectField name="dir" defaultValue={filters.dir} aria-label="Sort direction">
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </SelectField>
          </span>
        </label>

        <div className="flex gap-2">
          <Button type="submit">Apply</Button>
          {hasActiveContactFilters(filters) && (
            <Button asChild variant="outline">
              <Link href="/dashboard/contacts">Reset</Link>
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
