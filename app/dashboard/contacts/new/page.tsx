import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { createContact } from "@/actions/contacts";
import { ContactForm } from "@/components/contacts/contact-form";

export default async function NewContactPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col items-start gap-4">
      <Link
        href="/dashboard/contacts"
        className="text-sm text-slate-500 hover:text-slate-900"
      >
        ← Back to contacts
      </Link>
      <ContactForm
        action={createContact}
        title="New contact"
        submitLabel="Create contact"
        pendingLabel="Creating..."
      />
    </div>
  );
}
