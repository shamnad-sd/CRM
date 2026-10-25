"use client";

import { useState } from "react";
import { createTaskAction } from "@/actions/tasks";
import { TaskForm, type TaskFormDefaultValues } from "@/components/tasks/task-form";
import type { ContactOption } from "@/components/deals/contact-picker";
import type { DealPickerOption } from "@/components/tasks/deal-picker";
import type { UserOption } from "@/lib/users-data";
import type { AppUserRole } from "@/types/next-auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface QuickAddTaskButtonProps {
  contacts: ContactOption[];
  deals: DealPickerOption[];
  users: UserOption[];
  currentUserId: string;
  role: AppUserRole;
  defaultValues?: TaskFormDefaultValues;
  label?: string;
}

/** Small "+ Add Task" trigger that opens the reusable task form pre-filled with a contact/deal. */
export function QuickAddTaskButton({
  contacts,
  deals,
  users,
  currentUserId,
  role,
  defaultValues,
  label = "+ Add Task",
}: QuickAddTaskButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>New task</SheetTitle>
          </SheetHeader>
          <div className="p-6">
            <TaskForm
              action={createTaskAction}
              contacts={contacts}
              deals={deals}
              users={users}
              currentUserId={currentUserId}
              role={role}
              defaultValues={defaultValues}
              submitLabel="Create task"
              pendingLabel="Creating..."
              onSuccess={() => setOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
