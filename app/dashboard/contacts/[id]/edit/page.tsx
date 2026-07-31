import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getContactById } from "@/lib/contacts-data";
import { updateContact } from "@/actions/contacts";
import { ContactForm } from "@/components/contacts/contact-form";

interface EditContactPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditContactPage({ params }: EditContactPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const contact = await getContactById(id);
  if (!contact) {
    notFound();
  }

  const canManage =
    session.user.role === "admin" || contact.owner?.id === session.user.id;

  if (!canManage) {
    redirect(`/dashboard/contacts/${id}?error=forbidden`);
  }

  return (
    <div className="flex flex-col items-start gap-4">
      <Link
        href={`/dashboard/contacts/${id}`}
        className="text-sm text-slate-500 hover:text-slate-900"
      >
        ← Back to contact
      </Link>
      <ContactForm
        action={updateContact.bind(null, id)}
        defaultValues={{
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          company: contact.company,
          source: contact.source,
          tags: contact.tags,
        }}
        title="Edit contact"
        submitLabel="Save changes"
        pendingLabel="Saving..."
      />
    </div>
  );
}
