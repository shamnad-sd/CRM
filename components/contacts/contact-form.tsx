"use client";

import { useActionState } from "react";
import { CONTACT_SOURCES } from "@/lib/constants";
import type { ContactActionResult } from "@/actions/contacts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const initialState: ContactActionResult | undefined = undefined;

export interface ContactFormDefaultValues {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
  tags?: string[];
}

interface ContactFormProps {
  action: (
    prevState: ContactActionResult | undefined,
    formData: FormData
  ) => Promise<ContactActionResult>;
  defaultValues?: ContactFormDefaultValues;
  title: string;
  submitLabel: string;
  pendingLabel: string;
}

export function ContactForm({
  action,
  defaultValues,
  title,
  submitLabel,
  pendingLabel,
}: ContactFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="flex flex-col gap-4">
          {state?.error && (
            <p className="text-sm text-red-600" role="alert">
              {state.error}
            </p>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              defaultValue={defaultValues?.name}
              required
            />
            {state?.fieldErrors?.name && (
              <p className="text-xs text-red-600">{state.fieldErrors.name[0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={defaultValues?.email}
              required
            />
            {state?.fieldErrors?.email && (
              <p className="text-xs text-red-600">{state.fieldErrors.email[0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+1 555 123 4567"
              defaultValue={defaultValues?.phone}
            />
            {state?.fieldErrors?.phone && (
              <p className="text-xs text-red-600">{state.fieldErrors.phone[0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              name="company"
              type="text"
              defaultValue={defaultValues?.company}
            />
            {state?.fieldErrors?.company && (
              <p className="text-xs text-red-600">{state.fieldErrors.company[0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="source">Source</Label>
            <select
              id="source"
              name="source"
              defaultValue={defaultValues?.source ?? CONTACT_SOURCES[0]}
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              {CONTACT_SOURCES.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
            {state?.fieldErrors?.source && (
              <p className="text-xs text-red-600">{state.fieldErrors.source[0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              name="tags"
              type="text"
              placeholder="vip, newsletter, prospect"
              defaultValue={defaultValues?.tags?.join(", ")}
            />
            <p className="text-xs text-slate-500">Comma-separated</p>
            {state?.fieldErrors?.tags && (
              <p className="text-xs text-red-600">{state.fieldErrors.tags[0]}</p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? pendingLabel : submitLabel}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
