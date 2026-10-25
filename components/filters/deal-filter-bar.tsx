import Link from "next/link";
import { DEAL_STAGES, DEAL_STAGE_LABELS } from "@/lib/constants";
import { hasActiveDealFilters, type DealFilters } from "@/lib/filters";
import type { UserOption } from "@/lib/users-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckboxDropdown } from "@/components/filters/checkbox-dropdown";
import { SelectField } from "@/components/filters/select-field";
import { ContactPicker, type ContactOption } from "@/components/deals/contact-picker";

interface DealFilterBarProps {
  filters: DealFilters;
  contacts: ContactOption[];
  /** Present only for admins; omitting it hides the owner filter. */
  ownerOptions?: UserOption[];
}

export function DealFilterBar({
  filters,
  contacts,
  ownerOptions,
}: DealFilterBarProps) {
  return (
    <form
      method="get"
      action="/dashboard/deals"
      className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4"
    >
      <CheckboxDropdown
        name="stage"
        label="Stage"
        options={DEAL_STAGES.map((s) => ({ value: s, label: DEAL_STAGE_LABELS[s] }))}
        selected={filters.stage}
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
        Min value
        <Input
          type="number"
          name="minValue"
          min={0}
          step="any"
          defaultValue={filters.minValue}
          className="w-32"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-slate-500">
        Max value
        <Input
          type="number"
          name="maxValue"
          min={0}
          step="any"
          defaultValue={filters.maxValue}
          className="w-32"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs text-slate-500">
        Close date from
        <Input type="date" name="closeFrom" defaultValue={filters.closeFrom} className="w-40" />
      </label>
      <label className="flex flex-col gap-1 text-xs text-slate-500">
        Close date to
        <Input type="date" name="closeTo" defaultValue={filters.closeTo} className="w-40" />
      </label>

      <div className="flex w-64 flex-col gap-1 text-xs text-slate-500">
        Contact
        <ContactPicker contacts={contacts} defaultContactId={filters.contact} />
      </div>

      <div className="flex gap-2">
        <Button type="submit">Apply</Button>
        {hasActiveDealFilters(filters) && (
          <Button asChild variant="outline">
            <Link href="/dashboard/deals">Reset</Link>
          </Button>
        )}
      </div>
    </form>
  );
}
