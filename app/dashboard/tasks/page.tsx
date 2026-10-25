import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTasksForUser, groupTasksByDueDate, type GroupedTasks } from "@/lib/tasks-data";
import { getContactOptions } from "@/lib/contacts-data";
import { getDealOptions } from "@/lib/deals-data";
import { getUserOptions } from "@/lib/users-data";
import { createTaskAction } from "@/actions/tasks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskRow } from "@/components/tasks/task-row";
import { TaskForm } from "@/components/tasks/task-form";
import { TasksViewToggle } from "@/components/tasks/tasks-view-toggle";

interface TasksPageProps {
  searchParams: Promise<{ all?: string }>;
}

const SECTIONS: { key: keyof GroupedTasks; label: string }[] = [
  { key: "overdue", label: "Overdue" },
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
];

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const sp = await searchParams;
  const includeAll = session.user.role === "admin" && sp.all === "true";

  const [tasks, contacts, deals, users] = await Promise.all([
    getTasksForUser(session.user.id, session.user.role, includeAll),
    getContactOptions({ userId: session.user.id, role: session.user.role }),
    getDealOptions({ userId: session.user.id, role: session.user.role }),
    session.user.role === "admin" ? getUserOptions() : Promise.resolve([]),
  ]);

  const grouped = groupTasksByDueDate(tasks);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Tasks</h1>
          <p className="text-sm text-slate-500">
            {tasks.length} task{tasks.length === 1 ? "" : "s"}
            {includeAll ? " (all users)" : ""}
          </p>
        </div>
        {session.user.role === "admin" && (
          <TasksViewToggle includeAll={includeAll} />
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {SECTIONS.map(({ key, label }) => (
            <Card key={key}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  {label}
                  <span className="text-xs font-normal text-slate-400">
                    {grouped[key].length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {grouped[key].length === 0 ? (
                  <p className="text-sm text-slate-500">Nothing here.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {grouped[key].map((task) => (
                      <TaskRow key={task.id} task={task} showAssignee={includeAll} />
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">+ New Task</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskForm
              action={createTaskAction}
              contacts={contacts}
              deals={deals}
              users={users}
              currentUserId={session.user.id}
              role={session.user.role}
              submitLabel="Create task"
              pendingLabel="Creating..."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
