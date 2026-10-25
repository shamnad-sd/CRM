import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDashboardStats } from "@/lib/deals-data";
import { getTasksForUser, groupTasksByDueDate } from "@/lib/tasks-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MyTasksWidget } from "@/components/dashboard/my-tasks-widget";
import { formatCurrency } from "@/lib/format";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const [stats, tasks] = await Promise.all([
    getDashboardStats({
      userId: session.user.id,
      role: session.user.role,
    }),
    // Always the signed-in user's own tasks, regardless of role — this is
    // a personal "what's on my plate" widget, not the admin all-tasks view.
    getTasksForUser(session.user.id, session.user.role),
  ]);

  const grouped = groupTasksByDueDate(tasks);

  const cards = [
    {
      label: "Open deals",
      value: stats.openDealsCount.toString(),
      sub: formatCurrency(stats.openDealsValue),
    },
    {
      label: "Won this month",
      value: stats.wonThisMonthCount.toString(),
      sub: formatCurrency(stats.wonThisMonthValue),
    },
    {
      label: "Total contacts",
      value: stats.totalContacts.toString(),
      sub: session.user.role === "admin" ? "All owners" : "Owned by you",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-slate-900">{card.value}</p>
              <p className="mt-1 text-sm text-slate-500">{card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MyTasksWidget todayTasks={grouped.today} overdueCount={grouped.overdue.length} />
      </div>
    </div>
  );
}
