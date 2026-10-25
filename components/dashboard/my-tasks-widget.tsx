import Link from "next/link";
import type { TaskSummary } from "@/lib/tasks-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";

interface MyTasksWidgetProps {
  todayTasks: TaskSummary[];
  overdueCount: number;
}

function taskLinkHref(task: TaskSummary): string {
  if (task.contact) return `/dashboard/contacts/${task.contact.id}`;
  if (task.deal) return `/dashboard/deals?open=${task.deal.id}`;
  return "/dashboard/tasks";
}

export function MyTasksWidget({ todayTasks, overdueCount }: MyTasksWidgetProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-slate-500">
          My tasks today
        </CardTitle>
        {overdueCount > 0 && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
            {overdueCount} overdue
          </span>
        )}
      </CardHeader>
      <CardContent>
        {todayTasks.length === 0 ? (
          <p className="text-sm text-slate-500">Nothing due today.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {todayTasks.map((task) => (
              <li key={task.id}>
                <Link
                  href={taskLinkHref(task)}
                  className="block text-sm text-slate-900 hover:underline"
                >
                  {task.title}
                </Link>
                <p className="text-xs text-slate-500">{formatDate(task.dueDate)}</p>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/dashboard/tasks"
          className="mt-3 inline-block text-xs font-medium text-slate-500 hover:text-slate-900"
        >
          View all tasks →
        </Link>
      </CardContent>
    </Card>
  );
}
