import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getContactOptions } from "@/lib/contacts-data";
import { createDeal } from "@/actions/deals";
import { DealForm } from "@/components/deals/deal-form";

interface NewDealPageProps {
  searchParams: Promise<{ contactId?: string }>;
}

export default async function NewDealPage({ searchParams }: NewDealPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const sp = await searchParams;
  const contacts = await getContactOptions({
    userId: session.user.id,
    role: session.user.role,
  });

  return (
    <div className="flex flex-col items-start gap-4">
      <Link
        href="/dashboard/deals"
        className="text-sm text-slate-500 hover:text-slate-900"
      >
        ← Back to deals
      </Link>
      <DealForm
        action={createDeal}
        contacts={contacts}
        defaultValues={sp.contactId ? { contactId: sp.contactId } : undefined}
        title="New deal"
        submitLabel="Create deal"
        pendingLabel="Creating..."
      />
    </div>
  );
}
