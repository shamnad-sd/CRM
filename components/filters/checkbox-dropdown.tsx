interface CheckboxDropdownProps {
  /** Form field name; each checked option is submitted as a repeated param. */
  name: string;
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
}

/**
 * Multi-select built on <details> + checkboxes, so it works inside a plain
 * GET form with no client JS and submits as `?name=a&name=b`.
 */
export function CheckboxDropdown({
  name,
  label,
  options,
  selected,
}: CheckboxDropdownProps) {
  return (
    <details className="group relative">
      <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
        {label}
        {selected.length > 0 && (
          <span className="rounded-full bg-slate-900 px-1.5 text-xs text-white">
            {selected.length}
          </span>
        )}
        <span aria-hidden className="text-xs text-slate-400 group-open:rotate-180">
          ▾
        </span>
      </summary>
      <div className="absolute z-20 mt-1 max-h-64 min-w-48 overflow-y-auto rounded-md border border-slate-200 bg-white p-2 shadow-md">
        {options.length === 0 ? (
          <p className="px-2 py-1 text-sm text-slate-500">No options yet</p>
        ) : (
          options.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-slate-900 hover:bg-slate-100"
            >
              <input
                type="checkbox"
                name={name}
                value={option.value}
                defaultChecked={selected.includes(option.value)}
                className="h-4 w-4 rounded border-slate-300"
              />
              {option.label}
            </label>
          ))
        )}
      </div>
    </details>
  );
}
