"use client";

import { useActionState, useEffect, useRef } from "react";
import type { TaskActionResult } from "@/actions/tasks";
import type { AppUserRole } from "@/types/next-auth";
import type { UserOption } from "@/lib/users-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ContactPicker, type ContactOption } from "@/components/deals/contact-picker";
import { DealPicker, type DealPickerOption } from "@/components/tasks/deal-picker";

const initialState: TaskActionResult | undefined = undefined;

export interface TaskFormDefaultValues {
  title?: string;
  dueDate?: string;
  contactId?: string;
  dealId?: string;
  assignedTo?: string;
}

interface TaskFormProps {
  action: (
    prevState: TaskActionResult | undefined,
    formData: FormData
  ) => Promise<TaskActionResult>;
  contacts: ContactOption[];
  deals: DealPickerOption[];
  users: UserOption[];
  currentUserId: string;
  role: AppUserRole;
  defaultValues?: TaskFormDefaultValues;
  submitLabel: string;
  pendingLabel: string;
  onSuccess?: () => void;
}

function toDateInputValue(value?: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

export function TaskForm({
  action,
  contacts,
  deals,
  users,
  currentUserId,
  role,
  defaultValues,
  submitLabel,
  pendingLabel,
  onSuccess,
}: TaskFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      onSuccess?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
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
        <Label htmlFor="dueDate">Due date</Label>
        <Input
          id="dueDate"
          name="dueDate"
          type="date"
          defaultValue={toDateInputValue(defaultValues?.dueDate)}
          required
        />
        {state?.fieldErrors?.dueDate && (
          <p className="text-xs text-red-600">{state.fieldErrors.dueDate[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="contact-picker">Contact (optional)</Label>
        <ContactPicker
          contacts={contacts}
          defaultContactId={defaultValues?.contactId}
        />
        {state?.fieldErrors?.contactId && (
          <p className="text-xs text-red-600">{state.fieldErrors.contactId[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="deal-picker">Deal (optional)</Label>
        <DealPicker deals={deals} defaultDealId={defaultValues?.dealId} />
        {state?.fieldErrors?.dealId && (
          <p className="text-xs text-red-600">{state.fieldErrors.dealId[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="assignedTo">Assigned to</Label>
        {role === "admin" ? (
          <select
            id="assignedTo"
            name="assignedTo"
            defaultValue={defaultValues?.assignedTo ?? currentUserId}
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        ) : (
          <>
            <p className="text-sm text-slate-700">You</p>
            <input type="hidden" name="assignedTo" value={currentUserId} />
          </>
        )}
        {state?.fieldErrors?.assignedTo && (
          <p className="text-xs text-red-600">
            {state.fieldErrors.assignedTo[0]}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}
