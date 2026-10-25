import Link from "next/link";

interface TasksViewToggleProps {
  includeAll: boolean;
}

/** Admin-only link that flips between "my tasks" and "all tasks" on the tasks page. */
export function TasksViewToggle({ includeAll }: TasksViewToggleProps) {
  return (
    <Link
      href={includeAll ? "/dashboard/tasks" : "/dashboard/tasks?all=true"}
      className="text-sm font-medium text-slate-700 underline underline-offset-2 hover:text-slate-900"
    >
      {includeAll ? "View my tasks" : "View all tasks"}
    </Link>
  );
}
