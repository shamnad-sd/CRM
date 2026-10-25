"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface ContactOption {
  id: string;
  name: string;
  email: string;
  company?: string;
}

interface ContactPickerProps {
  contacts: ContactOption[];
  defaultContactId?: string;
}

export function ContactPicker({ contacts, defaultContactId }: ContactPickerProps) {
  const defaultContact = contacts.find((c) => c.id === defaultContactId);
  const [selectedId, setSelectedId] = useState(defaultContactId ?? "");
  const [query, setQuery] = useState(defaultContact?.name ?? "");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts.slice(0, 8);
    return contacts
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.company?.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [contacts, query]);

  return (
    <div className="relative">
      <input type="hidden" name="contactId" value={selectedId} />
      <Input
        type="text"
        placeholder="Search contacts by name, email, or company..."
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
          {filtered.map((contact) => (
            <li key={contact.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setSelectedId(contact.id);
                  setQuery(contact.name);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-slate-100",
                  selectedId === contact.id && "bg-slate-50"
                )}
              >
                <span className="font-medium text-slate-900">{contact.name}</span>
                <span className="text-xs text-slate-500">
                  {contact.email}
                  {contact.company ? ` · ${contact.company}` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && filtered.length === 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-md">
          No contacts found.
        </div>
      )}
    </div>
  );
}
