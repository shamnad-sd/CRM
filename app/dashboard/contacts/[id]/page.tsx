import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getContactById, getContactOptions } from "@/lib/contacts-data";
import { getDealsForContact, getDealOptions } from "@/lib/deals-data";
import { getUserOptions } from "@/lib/users-data";
import { DEAL_STAGE_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteContactButton } from "@/components/contacts/delete-contact-button";
import { ActivityTimeline } from "@/components/activities/activity-timeline";
import { QuickAddTaskButton } from "@/components/tasks/quick-add-task-button";
import { formatCurrency } from "@/lib/format";

interface ContactDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    created?: string;
    updated?: string;
    error?: string;
  }>;
}

export default async function ContactDetailPage({
  params,
  searchParams,
}: ContactDetailPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const sp = await searchParams;

  const contact = await getContactById(id);
  if (!contact) {
    notFound();
  }

  const [deals, contactOptions, dealOptions, userOptions] = await Promise.all([
    getDealsForContact(id, {
      userId: session.user.id,
      role: session.user.role,
    }),
    getContactOptions({ userId: session.user.id, role: session.user.role }),
    getDealOptions({ userId: session.user.id, role: session.user.role }),
    session.user.role === "admin" ? getUserOptions() : Promise.resolve([]),
  ]);

  const canManage =
    session.user.role === "admin" || contact.owner?.id === session.user.id;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/dashboard/contacts"
        className="text-sm text-slate-500 hover:text-slate-900"
      >
        ← Back to contacts
      </Link>

      {sp.created === "true" && (
        <p className="rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
          Contact created.
        </p>
      )}
      {sp.updated === "true" && (
        <p className="rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
          Contact updated.
        </p>
      )}
      {sp.error === "forbidden" && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          You don&apos;t have permission to modify this contact.
        </p>
      )}

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>{contact.name}</CardTitle>
            <p className="text-sm text-slate-500">{contact.email}</p>
          </div>
          {canManage && (
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href={`/dashboard/contacts/${contact.id}/edit`}>Edit</Link>
              </Button>
              <DeleteContactButton contactId={contact.id} />
            </div>
          )}
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Phone
              </dt>
              <dd className="text-sm text-slate-900">{contact.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Company
              </dt>
              <dd className="text-sm text-slate-900">{contact.company ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Source
              </dt>
              <dd className="text-sm text-slate-900">{contact.source}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Owner
              </dt>
              <dd className="text-sm text-slate-900">
                {contact.owner?.name ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Created
              </dt>
              <dd className="text-sm text-slate-900">
                {new Date(contact.createdAt).toLocaleDateString()}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Tags
              </dt>
              <dd className="mt-1 flex flex-wrap gap-2">
                {contact.tags.length === 0 ? (
                  <span className="text-sm text-slate-500">—</span>
                ) : (
                  contact.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                    >
                      {tag}
                    </span>
                  ))
                )}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Deals</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/deals/new?contactId=${contact.id}`}>
              + New Deal
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {deals.length === 0 ? (
            <p className="text-sm text-slate-500">No deals yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {deals.map((deal) => (
                <li key={deal.id} className="flex items-center justify-between py-2">
                  <div>
                    <Link
                      href={`/dashboard/deals?open=${deal.id}`}
                      className="text-sm font-medium text-slate-900 hover:underline"
                    >
                      {deal.title}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {DEAL_STAGE_LABELS[deal.stage]}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">
                    {formatCurrency(deal.value)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Activity Timeline</CardTitle>
          <QuickAddTaskButton
            contacts={contactOptions}
            deals={dealOptions}
            users={userOptions}
            currentUserId={session.user.id}
            role={session.user.role}
            defaultValues={{ contactId: contact.id }}
          />
        </CardHeader>
        <CardContent>
          <ActivityTimeline contactId={contact.id} />
        </CardContent>
      </Card>
    </div>
  );
}
