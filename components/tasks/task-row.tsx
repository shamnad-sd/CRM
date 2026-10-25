"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toggleTaskStatusAction } from "@/actions/tasks";
import type { TaskSummary } from "@/lib/tasks-data";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

interface TaskRowProps {
  task: TaskSummary;
  /** Show who the task is assigned to (useful in the admin "all tasks" view). */
  showAssignee?: boolean;
}

export function TaskRow({ task, showAssignee = false }: TaskRowProps) {
  const [isPending, startTransition] = useTransition();
  const [checked, setChecked] = useState(task.status === "done");
  const [error, setError] = useState<string | null>(null);

  const handleToggle = () => {
    const next = !checked;
    setChecked(next);
    setError(null);

    startTransition(async () => {
      const result = await toggleTaskStatusAction(task.id);
      if (!result.success) {
        setChecked(!next);
        setError(result.error ?? "Could not update task.");
      }
    });
  };

  return (
    <li className="flex items-start gap-3 py-3">
      <input
        type="checkbox"
        checked={checked}
        disabled={isPending}
        onChange={handleToggle}
        className="mt-1 h-4 w-4 rounded border-slate-300"
        aria-label={`Mark "${task.title}" as ${checked ? "pending" : "done"}`}
      />
      <div className="flex-1">
        <p
          className={cn(
            "text-sm font-medium text-slate-900",
            checked && "text-slate-400 line-through"
          )}
        >
          {task.title}
        </p>
        <p className="text-xs text-slate-500">
          Due {formatDate(task.dueDate)}
          {task.contact && (
            <>
              {" · "}
              <Link
                href={`/dashboard/contacts/${task.contact.id}`}
                className="underline underline-offset-2 hover:text-slate-900"
              >
                {task.contact.name}
              </Link>
            </>
          )}
          {task.deal && (
            <>
              {" · "}
              <Link
                href={`/dashboard/deals?open=${task.deal.id}`}
                className="underline underline-offset-2 hover:text-slate-900"
              >
                {task.deal.name}
              </Link>
            </>
          )}
          {showAssignee && task.assignedTo && <>{" · "}{task.assignedTo.name}</>}
        </p>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </li>
  );
}
