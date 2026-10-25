import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDeals, getDealOptions } from "@/lib/deals-data";
import { getContactOptions } from "@/lib/contacts-data";
import { getUserOptions } from "@/lib/users-data";
import { Button } from "@/components/ui/button";
import { KanbanBoard } from "@/components/deals/kanban-board";

interface DealsPageProps {
  searchParams: Promise<{
    created?: string;
    updated?: string;
    deleted?: string;
    error?: string;
    open?: string;
  }>;
}

export default async function DealsPage({ searchParams }: DealsPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const sp = await searchParams;

  const [deals, contacts, dealOptions, userOptions] = await Promise.all([
    getDeals({ userId: session.user.id, role: session.user.role }),
    getContactOptions({ userId: session.user.id, role: session.user.role }),
    getDealOptions({ userId: session.user.id, role: session.user.role }),
    session.user.role === "admin" ? getUserOptions() : Promise.resolve([]),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Deals</h1>
          <p className="text-sm text-slate-500">
            {deals.length} deal{deals.length === 1 ? "" : "s"}
            {session.user.role === "admin" ? " (all owners)" : ""}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/deals/new">+ New Deal</Link>
        </Button>
      </div>

      {sp.created === "true" && (
        <p className="rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
          Deal created.
        </p>
      )}
      {sp.updated === "true" && (
        <p className="rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
          Deal updated.
        </p>
      )}
      {sp.deleted === "true" && (
        <p className="rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
          Deal deleted.
        </p>
      )}
      {sp.error === "forbidden" && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          You don&apos;t have permission to modify that deal.
        </p>
      )}

      {contacts.length === 0 && deals.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="text-slate-600">
            You need a contact before you can create a deal.
          </p>
          <Button asChild variant="outline">
            <Link href="/dashboard/contacts/new">+ New Contact</Link>
          </Button>
        </div>
      ) : (
        <KanbanBoard
          initialDeals={deals}
          contacts={contacts}
          dealOptions={dealOptions}
          userOptions={userOptions}
          currentUserId={session.user.id}
          role={session.user.role}
          initialOpenDealId={sp.open}
        />
      )}
    </div>
  );
}
