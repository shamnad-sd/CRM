"use client";

import { useActionState } from "react";
import { DEAL_STAGES, DEAL_STAGE_LABELS } from "@/lib/constants";
import type { DealActionResult } from "@/actions/deals";
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
import { ContactPicker, type ContactOption } from "@/components/deals/contact-picker";

const initialState: DealActionResult | undefined = undefined;

export interface DealFormDefaultValues {
  title?: string;
  contactId?: string;
  value?: number;
  stage?: string;
  expectedCloseDate?: string | null;
}

interface DealFormProps {
  action: (
    prevState: DealActionResult | undefined,
    formData: FormData
  ) => Promise<DealActionResult>;
  contacts: ContactOption[];
  defaultValues?: DealFormDefaultValues;
  title: string;
  submitLabel: string;
  pendingLabel: string;
}

function toDateInputValue(value?: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

export function DealForm({
  action,
  contacts,
  defaultValues,
  title,
  submitLabel,
  pendingLabel,
}: DealFormProps) {
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
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              type="text"
              defaultValue={defaultValues?.title}
              required
            />
            {state?.fieldErrors?.title && (
              <p className="text-xs text-red-600">{state.fieldErrors.title[0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="contact-picker">Contact</Label>
            <ContactPicker
              contacts={contacts}
              defaultContactId={defaultValues?.contactId}
            />
            {state?.fieldErrors?.contactId && (
              <p className="text-xs text-red-600">{state.fieldErrors.contactId[0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="value">Value ($)</Label>
            <Input
              id="value"
              name="value"
              type="number"
              min="0"
              step="0.01"
              defaultValue={defaultValues?.value}
              required
            />
            {state?.fieldErrors?.value && (
              <p className="text-xs text-red-600">{state.fieldErrors.value[0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="stage">Stage</Label>
            <select
              id="stage"
              name="stage"
              defaultValue={defaultValues?.stage ?? "new"}
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              {DEAL_STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {DEAL_STAGE_LABELS[stage]}
                </option>
              ))}
            </select>
            {state?.fieldErrors?.stage && (
              <p className="text-xs text-red-600">{state.fieldErrors.stage[0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="expectedCloseDate">Expected close date</Label>
            <Input
              id="expectedCloseDate"
              name="expectedCloseDate"
              type="date"
              defaultValue={toDateInputValue(defaultValues?.expectedCloseDate)}
            />
            {state?.fieldErrors?.expectedCloseDate && (
              <p className="text-xs text-red-600">
                {state.fieldErrors.expectedCloseDate[0]}
              </p>
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
