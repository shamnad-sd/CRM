import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getContactsFiltered, getContactTagOptions } from "@/lib/contacts-data";
import { getUserOptions } from "@/lib/users-data";
import {
  contactFiltersToQuery,
  hasActiveContactFilters,
  parseContactFilters,
  type RawSearchParams,
} from "@/lib/filters";
import { buildContactChips } from "@/lib/filter-chips";
import { Button } from "@/components/ui/button";
import { ContactFilterBar } from "@/components/filters/contact-filter-bar";
import { FilterChips } from "@/components/filters/filter-chips";

interface ContactsPageProps {
  searchParams: Promise<RawSearchParams>;
}

export default async function ContactsPage({ searchParams }: ContactsPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const sp = await searchParams;
  const filters = parseContactFilters(sp);
  const user = { userId: session.user.id, role: session.user.role };
  const isAdmin = user.role === "admin";

  const [result, tagOptions, ownerOptions] = await Promise.all([
    getContactsFiltered(filters, user),
    getContactTagOptions(user),
    isAdmin ? getUserOptions() : Promise.resolve(undefined),
  ]);
  const { contacts, total, totalPages, page: currentPage } = result;

  const filtersActive = hasActiveContactFilters(filters);
  const ownerNames = new Map((ownerOptions ?? []).map((u) => [u.id, u.name]));
  const chips = buildContactChips(filters, ownerNames);

  const buildHref = (targetPage: number) => {
    const query = contactFiltersToQuery(filters, { page: targetPage });
    return query ? `/dashboard/contacts?${query}` : "/dashboard/contacts";
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Contacts</h1>
          <p className="text-sm text-slate-500">
            {total} contact{total === 1 ? "" : "s"}
            {filtersActive ? " found" : ""}
            {isAdmin && !filters.owner ? " (all owners)" : ""}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/contacts/new">+ New Contact</Link>
        </Button>
      </div>

      {sp.deleted === "true" && (
        <p className="rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
          Contact deleted.
        </p>
      )}

      <ContactFilterBar
        filters={filters}
        tagOptions={tagOptions}
        ownerOptions={ownerOptions}
      />

      <FilterChips chips={chips} clearHref="/dashboard/contacts" />

      {contacts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-white py-16 text-center">
          {filtersActive ? (
            <>
              <p className="text-slate-600">No contacts match these filters.</p>
              <Button asChild variant="outline">
                <Link href="/dashboard/contacts">Clear all filters</Link>
              </Button>
            </>
          ) : (
            <>
              <p className="text-slate-600">No contacts yet — add your first one.</p>
              <Button asChild>
                <Link href="/dashboard/contacts/new">+ New Contact</Link>
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/contacts/${contact.id}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {contact.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{contact.email}</td>
                  <td className="px-4 py-3 text-slate-600">{contact.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{contact.company ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{contact.source}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {contact.owner?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(contact.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {contacts.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link
                href={buildHref(currentPage - 1)}
                aria-disabled={currentPage <= 1}
                className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
              >
                Previous
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link
                href={buildHref(currentPage + 1)}
                aria-disabled={currentPage >= totalPages}
                className={
                  currentPage >= totalPages ? "pointer-events-none opacity-50" : ""
                }
              >
                Next
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
